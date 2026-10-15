'use server';

/**
 * Server Action: Update Order Status
 * 
 * Updates order status with validation and triggers email notifications
 * CRITICAL: Also handles inventory commitment/release based on status changes
 */

import { db } from '@/lib/db';
import { orders } from '@/drizzle/src/db/schema';
import { inventoryReservations, inventoryReservationItems } from '@/drizzle/src/db/inventory-schema';
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
} from '@/lib/emails/email';
import { getCustomerData } from '@/lib/customer-data';
import { getOrderItems } from '@/lib/order-items';
import { 
  confirmReservation, 
  releaseReservation, 
  returnInventory 
} from '@/lib/inventory/service';
import { requireAdminSession } from '@/lib/auth-guard';

interface UpdateOrderStatusParams {
  orderId: string;
  newStatus: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export async function updateOrderStatus(params: UpdateOrderStatusParams) {
  await requireAdminSession();
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

    // Get reservation for this order to handle inventory
    const reservation = await db.query.inventoryReservations.findFirst({
      where: eq(inventoryReservations.orderId, orderId),
    });


    // CRITICAL: Handle inventory based on status transition
    // This ensures stock levels are accurate and prevents overselling
    
    // CASE 1: Confirm/Ship/Deliver order - Commit inventory (decrease onHand, decrease reserved)
    if ((newStatus === 'confirmed' || newStatus === 'shipped' || newStatus === 'delivered') && reservation && reservation.status === 'active') {
      try {
        await confirmReservation(reservation.id, 'system');
      } catch (error) {
        console.error(`[Inventory] ✗ Failed to commit inventory for order ${orderId}:`, error);
        return { 
          success: false, 
          error: `Failed to commit inventory: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    } else if ((newStatus === 'confirmed' || newStatus === 'shipped' || newStatus === 'delivered') && reservation && reservation.status === 'confirmed') {
      // Already confirmed, nothing to do
    } else if ((newStatus === 'confirmed' || newStatus === 'shipped' || newStatus === 'delivered') && !reservation) {
      console.warn(`[Inventory] No reservation found for order ${orderId}, skipping inventory commitment`);
    }

    // CASE 2: Cancel order - Release reservation (decrease reserved only, no change to onHand)
    if (newStatus === 'cancelled' && reservation && reservation.status === 'active') {
      try {
        await releaseReservation(reservation.id);
      } catch (error) {
        console.error(`[Inventory] ✗ Failed to release reservation for order ${orderId}:`, error);
        // Don't fail the order update, just log the error
      }
    }

    // CASE 3: Refund order - Return inventory to stock (increase onHand)
    if (newStatus === 'refunded' && reservation && reservation.status === 'confirmed') {
      try {
        
        // Get all reservation items to know what to return
        const items = await db.query.inventoryReservationItems.findMany({
          where: eq(inventoryReservationItems.reservationId, reservation.id),
        });


        // Return each item to inventory
        for (const item of items) {
          await returnInventory(
            item.variantId,
            item.locationId,
            item.quantity,
            orderId,
            'system'
          );
        }
        
      } catch (error) {
        console.error(`[Inventory] ✗ Failed to return inventory for order ${orderId}:`, error);
        // Don't fail the order update, just log the error
      }
    }

    // Prepare update data
    const updateData: {
      status: OrderStatus;
      shippedAt?: Date;
      trackingNumber?: string;
      carrier?: string;
      deliveredAt?: Date;
    } = {
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
