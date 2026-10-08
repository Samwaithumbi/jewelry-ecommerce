'use server';

/**
 * Server Action: Create Order
 * 
 * This server action creates an order from the cart items.
 * It calculates totals, reserves inventory, and creates the order record in the database.
 * 
 * INTEGRATION: This now integrates with the inventory system to reserve stock
 * before the order is created and payment is initiated.
 */

import { db } from '@/lib/db';
import { orders, orderItems } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';
import { getCart } from '@/app/actions/cart/get-cart';
import { Cart } from '@/types/cart';
import { reserveInventory, InsufficientStockError } from '@/lib/inventory/service';

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface GiftOptions {
  isGiftWrap: boolean;
  giftMessage: string;
  shipAsGift: boolean;
}

export async function createOrderFromCart(
  userId?: string,
  shippingAddress?: ShippingAddress,
  giftOptions?: GiftOptions
) {
  try {
    // Get cart items
    const cart = await getCart();

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate order totals
    const subtotalCents = cart.items.reduce(
      (acc, item) => acc + item.priceAtAdd * item.qty,
      0
    );

    // For now, use fixed shipping and tax
    // In production, calculate based on shipping address, location, etc.
    const shippingCents = 0; // Free shipping for now
    const giftWrapCents = giftOptions?.isGiftWrap ? 1200 : 0; // $12
    const taxCents = Math.round((subtotalCents + giftWrapCents) * 0.16); // 16% VAT
    const totalCents = subtotalCents + shippingCents + giftWrapCents + taxCents;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order record
    const order = await db.insert(orders).values({
      orderNumber,
      userId: userId || null,
      status: 'pending',
      subtotalCents,
      shippingCents,
      taxCents,
      giftWrapCents,
      discountCents: 0,
      totalCents,
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

    const createdOrder = order[0];

    // Create order items from cart items
    for (const item of cart.items) {
      await db.insert(orderItems).values({
        orderId: createdOrder.id,
        productId: item.productId,
        variantId: item.variantId || null,
        qty: item.qty,
        priceCents: item.priceAtAdd,
        engravingText: item.engravingText || null,
        engravingFont: item.engravingFont || null,
        engravingPriceCents: item.engravingPriceCents || null,
      });
    }

    // Reserve inventory for the order
    // This is critical to prevent overselling
    const reservationItems = cart.items
      .filter(item => item.variantId) // Only reserve items with variants
      .map(item => ({
        variantId: item.variantId!,
        quantity: item.qty,
      }));

    let reservationId: string | null = null;

    if (reservationItems.length > 0) {
      try {
        // Reserve inventory for 15 minutes (same as payment expiry)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        reservationId = await reserveInventory({
          orderId: createdOrder.id,
          userId,
          items: reservationItems,
          expiresAt,
        });

        console.log(`Reserved inventory for order ${createdOrder.id}, reservation ${reservationId}`);
      } catch (error) {
        if (error instanceof InsufficientStockError) {
          // If stock is insufficient, cancel the order
          await db.delete(orders).where(eq(orders.id, createdOrder.id));
          await db.delete(orderItems).where(eq(orderItems.orderId, createdOrder.id));
          
          return {
            success: false,
            error: `Insufficient stock: ${error.message}`,
          };
        }
        
        // For other errors, log but continue (order created but inventory not reserved)
        console.error('Failed to reserve inventory:', error);
      }
    }

    // Clear cart after order creation
    const { clearCart } = await import('@/app/actions/cart/clear-cart');
    try {
      await clearCart();
      console.log(`Cleared cart after order creation: ${createdOrder.id}`);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // Don't throw - order is still created, cart clearing is nice-to-have
    }

    return {
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      totalCents: createdOrder.totalCents,
      reservationId,
    };
  } catch (error) {
    console.error('Order creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}
