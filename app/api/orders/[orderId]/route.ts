/**
 * Order Details API Endpoint
 * 
 * GET /api/orders/[orderId]
 * 
 * Security: Enforces customer order isolation.
 * Customers can only view their own orders; admins can view any order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get order details
    const orderResults = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        status: orders.status,
        subtotalCents: orders.subtotalCents,
        shippingCents: orders.shippingCents,
        taxCents: orders.taxCents,
        totalCents: orders.totalCents,
        shippingAddress: orders.shippingAddress,
        deviceFingerprint: orders.deviceFingerprint,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResults || orderResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResults[0];

    // Authorization check: customer isolation
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';

    if (order.userId) {
      // If order belongs to a registered customer, caller must be owner or admin
      if (order.userId !== sessionUserId && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
    } else {
      // Guest order: must be admin or match the guest session that created the order
      const guestSession = request.cookies.get('guest_session')?.value;
      const isGuestOwner = Boolean(
        guestSession &&
        order.deviceFingerprint &&
        guestSession === order.deviceFingerprint
      );
      if (!isGuestOwner && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
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

    let parsedAddress = order.shippingAddress;
    if (typeof parsedAddress === 'string') {
      try {
        parsedAddress = JSON.parse(parsedAddress);
      } catch {
        // ignore parse error
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        shippingAddress: parsedAddress,
        createdAt: order.createdAt,
        items,
      },
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
