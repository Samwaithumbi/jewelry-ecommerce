'use server';


import { db } from '@/lib/db';
import { orders, orderItems, products, productVariants } from '@/drizzle/src/db/schema';
import { inventoryLevels, inventoryLocations } from '@/drizzle/src/db/inventory-schema';
import { eq, and } from 'drizzle-orm';
import { getCart } from '@/app/actions/cart/get-cart';
import { redis } from '@/lib/redis';
import { cartKey } from '@/lib/cart';
import { getCartSessionId } from '@/lib/session';
import { reserveInventory, releaseReservation, InsufficientStockError } from '@/lib/inventory/service';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface GiftOptions {
  isGiftWrap: boolean;
  giftMessage: string;
  shipAsGift: boolean;
}

export interface PriceChangeDetail {
  productId: string;
  variantId?: string;
  name: string;
  oldPriceCents: number;
  newPriceCents: number;
}

export interface CreateOrderOptions {
  confirmedPriceChanges?: boolean;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalCents?: number;
  reservationId?: string | null;
  priceChanged?: boolean;
  priceChanges?: PriceChangeDetail[];
  error?: string;
}

export async function createOrderFromCart(
  userId?: string,
  shippingAddress?: ShippingAddress,
  giftOptions?: GiftOptions,
  options?: CreateOrderOptions
): Promise<CreateOrderResult> {
  let createdOrderId: string | null = null;
  let reservationId: string | null = null;

  try {
    const sessionId = await getCartSessionId();
    const cart = await getCart(sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // 1. Validate quantities and fetch authoritative prices from PostgreSQL
    const verifiedItems: Array<{
      productId: string;
      variantId?: string;
      name: string;
      qty: number;
      authoritativeUnitPriceCents: number;
      priceAtAddCents: number;
      engravingText?: string | null;
      engravingFont?: string | null;
      engravingPriceCents?: number | null;
    }> = [];

    const priceChanges: PriceChangeDetail[] = [];

    for (const item of cart.items) {
      // Validate quantity
      if (!Number.isInteger(item.qty) || item.qty <= 0 || item.qty > 100) {
        return {
          success: false,
          error: `Invalid quantity (${item.qty}) for item "${item.name || 'Unknown'}". Quantity must be between 1 and 100.`,
        };
      }

      // Fetch authoritative product from DB
      const dbProduct = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      if (!dbProduct) {
        return {
          success: false,
          error: `Product "${item.name || item.productId}" is no longer available.`,
        };
      }

      if (!dbProduct.active) {
        return {
          success: false,
          error: `Product "${dbProduct.name}" is currently inactive and cannot be purchased.`,
        };
      }

      let variantPriceAdjust = 0;

      // Validate variant if specified
      if (item.variantId) {
        const dbVariant = await db.query.productVariants.findFirst({
          where: and(
            eq(productVariants.id, item.variantId),
            eq(productVariants.productId, item.productId)
          ),
        });

        if (!dbVariant) {
          return {
            success: false,
            error: `Selected variant for "${dbProduct.name}" does not exist or has been removed.`,
          };
        }

        if (!dbVariant.active) {
          return {
            success: false,
            error: `Selected variant for "${dbProduct.name}" is no longer active.`,
          };
        }

        variantPriceAdjust = dbVariant.priceAdjustCents || 0;
      }

      // Authoritative unit price in integer cents
      const authoritativeUnitPrice = dbProduct.basePriceCents + variantPriceAdjust;

      // Check if price changed since customer added item to cart
      if (item.priceAtAdd !== authoritativeUnitPrice) {
        priceChanges.push({
          productId: item.productId,
          variantId: item.variantId,
          name: dbProduct.name,
          oldPriceCents: item.priceAtAdd,
          newPriceCents: authoritativeUnitPrice,
        });
      }

      // F-22: Server-authoritative engraving price (1500 cents), never trust client-controlled cart
      const hasEngraving = Boolean(item.engravingText && item.engravingText.trim().length > 0);
      const STANDARD_ENGRAVING_PRICE_CENTS = 1500;
      const engravingPriceCents = hasEngraving ? STANDARD_ENGRAVING_PRICE_CENTS : null;

      verifiedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: dbProduct.name,
        qty: item.qty,
        authoritativeUnitPriceCents: authoritativeUnitPrice,
        priceAtAddCents: item.priceAtAdd,
        engravingText: hasEngraving ? item.engravingText!.trim() : null,
        engravingFont: item.engravingFont || null,
        engravingPriceCents,
      });
    }

    // 2. Enforce Price Change Integrity: Do not silently charge different amounts!
    if (priceChanges.length > 0 && !options?.confirmedPriceChanges) {
      // Update cart in Redis with updated prices so next view matches database reality
      try {
        const updatedCartItems = cart.items.map(item => {
          const match = verifiedItems.find(
            v => v.productId === item.productId && v.variantId === item.variantId
          );
          return match
            ? { ...item, priceAtAdd: match.authoritativeUnitPriceCents }
            : item;
        });

        await redis.set(
          cartKey(sessionId),
          { ...cart, items: updatedCartItems, updatedAt: new Date().toISOString() },
          { ex: 60 * 60 * 24 * 7 }
        );
      } catch (redisErr) {
        console.error('Failed to sync updated prices to Redis cart:', redisErr);
      }

      return {
        success: false,
        priceChanged: true,
        priceChanges,
        error: 'One or more item prices have changed since being added to your cart. Please review and confirm the updated prices before proceeding.',
      };
    }

    // 3. Server-side totals calculation in integer minor units (cents)
    let subtotalCents = 0;
    for (const item of verifiedItems) {
      const lineItemPrice = item.authoritativeUnitPriceCents * item.qty;
      const lineEngravingPrice = item.engravingPriceCents ? item.engravingPriceCents * item.qty : 0;
      subtotalCents += lineItemPrice + lineEngravingPrice;
    }

    const shippingCents = 0; // Free shipping
    // F-24: Standard gift wrap price (Ksh 100 = 10,000 cents)
    const GIFT_WRAP_PRICE_CENTS = 10000;
    const giftWrapCents = giftOptions?.isGiftWrap ? GIFT_WRAP_PRICE_CENTS : 0;
    const discountCents = 0;
    const taxableAmount = Math.max(0, subtotalCents + giftWrapCents - discountCents);
    const taxCents = Math.round(taxableAmount * 0.16); // 16% VAT
    const totalCents = subtotalCents + shippingCents + giftWrapCents + taxCents - discountCents;

    if (totalCents <= 0) {
      return { success: false, error: 'Calculated order total is invalid.' };
    }

    // 4. Pre-check stock levels at MAIN location before attempting reservation
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, 'MAIN'),
    });

    if (mainLocation) {
      for (const item of verifiedItems) {
        if (item.variantId) {
          const level = await db.query.inventoryLevels.findFirst({
            where: and(
              eq(inventoryLevels.variantId, item.variantId),
              eq(inventoryLevels.locationId, mainLocation.id)
            ),
          });

          const available = level ? level.onHand - level.reserved : 0;
          if (available < item.qty) {
            return {
              success: false,
              error: `Insufficient stock for "${item.name}": requested ${item.qty}, only ${available} available.`,
            };
          }
        }
      }
    }

    // 5. Atomic Reservation and Order Creation Boundaries
    const orderId = crypto.randomUUID();
    createdOrderId = orderId;

    const reservationItems = verifiedItems
      .filter(item => Boolean(item.variantId))
      .map(item => ({
        variantId: item.variantId!,
        quantity: item.qty,
      }));

    if (reservationItems.length > 0) {
      try {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute hold
        reservationId = await reserveInventory({
          orderId,
          userId,
          items: reservationItems,
          expiresAt,
        });
      } catch (resError) {
        if (resError instanceof InsufficientStockError) {
          return {
            success: false,
            error: `Insufficient stock: ${resError.message}`,
          };
        }
        throw resError;
      }
    }

    // 6. Generate order number and persist order with immutable snapshots in atomic transaction
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const createdOrder = await db.transaction(async (tx) => {
      const [orderRecord] = await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        userId: userId || null,
        status: 'pending',
        subtotalCents,
        shippingCents,
        taxCents,
        giftWrapCents,
        discountCents,
        totalCents,
        deviceFingerprint: sessionId,
        shippingAddress: shippingAddress ? {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          address: shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        } : {
          name: 'Customer Name',
          phone: '',
          email: '',
          address: '',
          city: '',
          postalCode: '',
          country: 'Kenya',
        },
        isGift: giftOptions?.isGiftWrap || false,
        giftMessage: giftOptions?.giftMessage || null,
        giftWrap: giftOptions?.isGiftWrap || false,
        hidePriceOnSlip: giftOptions?.shipAsGift || false,
      }).returning();

      // 7. Store immutable price snapshots in orderItems inside the transaction
      for (const item of verifiedItems) {
        await tx.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId: orderRecord.id,
          productId: item.productId,
          variantId: item.variantId || null,
          qty: item.qty,
          priceCents: item.authoritativeUnitPriceCents, // Immutable authoritative price snapshot
          engravingText: item.engravingText || null,
          engravingFont: item.engravingFont || null,
          engravingPriceCents: item.engravingPriceCents || null,
        });
      }

      return orderRecord;
    });

    // 8. Note on cart clearing:
    // Cart is intentionally preserved here. It is cleared on the checkout success page
    // after payment confirmation, so if payment fails or expires, the customer's cart remains intact.

    return {
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      totalCents: createdOrder.totalCents,
      reservationId,
    };
  } catch (error) {
    console.error('Order creation error:', error);

    // Rollback reservation if created but order failed
    if (reservationId) {
      try {
        await releaseReservation(reservationId);
      } catch (rollbackErr) {
        console.error('Failed to release reservation during order creation rollback:', rollbackErr);
      }
    }

    // Cleanup partial order records if inserted
    if (createdOrderId) {
      try {
        await db.delete(orderItems).where(eq(orderItems.orderId, createdOrderId));
        await db.delete(orders).where(eq(orders.id, createdOrderId));
      } catch (dbCleanupErr) {
        console.error('Failed to clean up partial order record:', dbCleanupErr);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}
