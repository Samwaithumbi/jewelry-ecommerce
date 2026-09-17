/**
 * Order Details API Endpoint
 * 
 * GET /api/orders/[orderId]
 * 
 * This endpoint returns the details of a specific order including items.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get order details
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        subtotalCents: orders.subtotalCents,
        shippingCents: orders.shippingCents,
        taxCents: orders.taxCents,
        totalCents: orders.totalCents,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order || order.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get order items with product details
    const items = await db
      .select({
        id: orderItems.id,
        qty: orderItems.qty,
        priceCents: orderItems.priceCents,
        productId: orderItems.productId,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({
      success: true,
      order: order[0],
      items,
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
