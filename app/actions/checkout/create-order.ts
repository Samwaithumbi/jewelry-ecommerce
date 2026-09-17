'use server';

/**
 * Server Action: Create Order
 * 
 * This server action creates an order from the cart items.
 * It calculates totals and creates the order record in the database.
 */

import { db } from '@/lib/db';
import { orders, orderItems } from '@/drizzle/src/db/schema';
import { getCart } from '@/app/actions/cart/get-cart';
import { Cart } from '@/types/cart';

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export async function createOrderFromCart(
  userId?: string,
  shippingAddress?: ShippingAddress
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
    const taxCents = Math.round(subtotalCents * 0.16); // 16% VAT
    const totalCents = subtotalCents + shippingCents + taxCents;

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
      giftWrapCents: 0,
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
      });
    }

    // Clear cart after order creation
    // TODO: Implement clear cart functionality

    return {
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      totalCents: createdOrder.totalCents,
    };
  } catch (error) {
    console.error('Order creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}
