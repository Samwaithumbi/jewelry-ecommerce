/**
 * Orders API Endpoint
 * 
 * GET /api/orders - List orders with filtering and pagination
 * PATCH /api/orders - Bulk update order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users } from '@/drizzle/src/db/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import { OrderStatus } from '@/lib/order-status';

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: any[] = [];

    if (status) {
      conditions.push(eq(orders.status, status as OrderStatus));
    }

    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.shippingAddress as any, `%${search}%`)
        )
      );
    }

    // Build the base query
    const baseQuery = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalCents: orders.totalCents,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        carrier: orders.carrier,
        createdAt: orders.createdAt,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        userId: orders.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id));

    // Apply conditions
    const finalQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // Apply sorting
    const sortColumn = sortBy === 'createdAt' ? orders.createdAt : orders.createdAt;
    const sortedQuery = finalQuery.orderBy(sortOrder === 'desc' ? desc(sortColumn) : sortColumn);

    // Apply pagination
    const paginatedQuery = sortedQuery.limit(limit).offset(offset);

    const ordersList = await paginatedQuery;

    // Get total count for pagination
    const countConditions = conditions.length > 0 ? and(...conditions) : undefined;
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(countConditions);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      orders: ordersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders - Bulk update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds, status, trackingNumber, carrier, estimatedDelivery } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderIds array is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 }
      );
    }

    // Update each order
    const results: any[] = [];
    for (const orderId of orderIds) {
      try {
        // Get current order
        const currentOrders = await db
          .select({ status: orders.status })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!currentOrders || currentOrders.length === 0) {
          results.push({ orderId, success: false, error: 'Order not found' });
          continue;
        }

        const currentStatus = currentOrders[0].status;

        // Validate transition
        const { isValidStatusTransition } = await import('@/lib/order-status');
        if (!isValidStatusTransition(currentStatus as OrderStatus, status as OrderStatus)) {
          results.push({ 
            orderId, 
            success: false, 
            error: `Invalid transition from ${currentStatus} to ${status}` 
          });
          continue;
        }

        // Prepare update data
        const updateData: any = { status };

        if (status === 'shipped') {
          updateData.shippedAt = new Date();
          if (trackingNumber) updateData.trackingNumber = trackingNumber;
          if (carrier) updateData.carrier = carrier;
        }

        if (status === 'delivered') {
          updateData.deliveredAt = new Date();
        }

        // Update order
        await db
          .update(orders)
          .set(updateData)
          .where(eq(orders.id, orderId));

        results.push({ orderId, success: true });
      } catch (error) {
        results.push({ 
          orderId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Update failed' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Bulk order update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update orders' },
      { status: 500 }
    );
  }
}

