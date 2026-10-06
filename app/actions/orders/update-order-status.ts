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
  sendOrderConfirmationEmailAsync,
  sendPaymentFailedEmailAsync,
  sendOrderShippedEmail, 
  sendOrderDeliveredEmail 
} from '@/lib/email';
import { getCustomerData } from '@/lib/customer-data';
import { getOrderItems } from '@/lib/order-items';

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

    // Get customer data for notifications
    const customer = await getCustomerData(orderId);
    const items = await getOrderItems(orderId);

    // Trigger email notifications based on status
    if (newStatus === 'confirmed' && customer.email) {
      // Send confirmation email asynchronously with idempotency check
      sendOrderConfirmationEmailAsync(orderId).catch(err => {
        console.error('Failed to send confirmation email on admin update:', err);
      });
    }

    if (newStatus === 'cancelled' && customer.email) {
      // Send cancellation / failure email asynchronously
      sendPaymentFailedEmailAsync(orderId, 'Order was cancelled by store administrator').catch(err => {
        console.error('Failed to send cancellation email on admin update:', err);
      });
    }

    if (newStatus === 'shipped' && customer.email && trackingNumber) {
      // Send shipped email
      await sendOrderShippedEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        orderNumber: currentOrder.orderNumber,
        trackingNumber,
        carrier: carrier || 'Carrier',
        trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourstore.com'}/account/orders?tracking=${trackingNumber}`,
        estimatedDelivery: estimatedDelivery || '3-5 business days',
        items,
      });
    }

    if (newStatus === 'delivered' && customer.email) {
      // Send delivered email
      await sendOrderDeliveredEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        orderNumber: currentOrder.orderNumber,
        deliveryDate: new Date().toISOString().split('T')[0],
        items,
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
