'use server';

/**
 * Server Action: Update Order Status
 * 
 * Updates order status with validation and triggers email notifications
 */

import { db } from '@/lib/db';
import { orders, users } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';
import { 
  isValidStatusTransition, 
  OrderStatus 
} from '@/lib/order-status';
import { 
  sendOrderConfirmationEmail, 
  sendOrderShippedEmail, 
  sendOrderDeliveredEmail 
} from '@/lib/email';

interface UpdateOrderStatusParams {
  orderId: string;
  newStatus: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export async function updateOrderStatus(params: UpdateOrderStatusParams) {
  try {
    const { orderId, newStatus, trackingNumber, carrier, estimatedDelivery } = params;

    // Get current order
    const currentOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        shippingAddress: orders.shippingAddress,
        totalCents: orders.totalCents,
        subtotalCents: orders.subtotalCents,
        shippingCents: orders.shippingCents,
        taxCents: orders.taxCents,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrders || currentOrders.length === 0) {
      return { success: false, error: 'Order not found' };
    }

    const currentOrder = currentOrders[0];

    // Validate status transition
    if (!isValidStatusTransition(currentOrder.status as OrderStatus, newStatus)) {
      return { 
        success: false, 
        error: `Invalid status transition from ${currentOrder.status} to ${newStatus}` 
      };
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
    };

    // Add timestamps based on status
    if (newStatus === 'shipped') {
      updateData.shippedAt = new Date();
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      if (carrier) updateData.carrier = carrier;
    }

    if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    // Update order
    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    // Get user email for notifications
    let userEmail = '';
    let userName = 'Customer';

    if (currentOrder.userId) {
      const userData = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, currentOrder.userId))
        .limit(1);

      if (userData && userData.length > 0) {
        userEmail = userData[0].email;
        userName = userData[0].name || 'Customer';
      }
    } else {
      // Get email from shipping address for guest orders
      const address = currentOrder.shippingAddress as any;
      userEmail = address?.email || '';
      userName = address?.name || 'Customer';
    }

    // Trigger email notifications based on status
    if (newStatus === 'confirmed' && userEmail) {
      // Send confirmation email
      // Note: You'll need to fetch order items for this
      await sendOrderConfirmationEmail({
        customerName: userName,
        customerEmail: userEmail,
        orderNumber: currentOrder.orderNumber,
        orderDate: currentOrder.createdAt.toISOString().split('T')[0],
        items: [], // TODO: Fetch order items
        subtotal: (currentOrder.subtotalCents / 100).toFixed(2),
        shipping: ((currentOrder.shippingCents || 0) / 100).toFixed(2),
        tax: ((currentOrder.taxCents || 0) / 100).toFixed(2),
        total: (currentOrder.totalCents / 100).toFixed(2),
        shippingAddress: currentOrder.shippingAddress as any,
      });
    }

    if (newStatus === 'shipped' && userEmail && trackingNumber) {
      // Send shipped email
      await sendOrderShippedEmail({
        customerName: userName,
        customerEmail: userEmail,
        orderNumber: currentOrder.orderNumber,
        trackingNumber,
        carrier: carrier || 'Carrier',
        trackingUrl: `https://track.example.com/${trackingNumber}`, // Replace with actual tracking URL
        estimatedDelivery: estimatedDelivery || '3-5 business days',
        items: [], // TODO: Fetch order items
      });
    }

    if (newStatus === 'delivered' && userEmail) {
      // Send delivered email
      await sendOrderDeliveredEmail({
        customerName: userName,
        customerEmail: userEmail,
        orderNumber: currentOrder.orderNumber,
        deliveryDate: new Date().toISOString().split('T')[0],
        items: [], // TODO: Fetch order items
      });
    }

    return {
      success: true,
      orderId,
      newStatus,
    };
  } catch (error) {
    console.error('Order status update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    };
  }
}
