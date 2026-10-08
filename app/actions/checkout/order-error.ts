'use server';

/**
 * Server Action: Checkout Order Error & Failure Reason
 * 
 * Resolves the specific reason for order/payment failure (e.g. from M-Pesa callback
 * or error params) and updates order/payment state accordingly without displaying
 * speculative generic reasons.
 */

import { db } from '@/lib/db';
import { orders, payments } from '@/drizzle/src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { OrderStatus } from '@/lib/order-status';
import { sendPaymentFailedEmailAsync } from '@/lib/email';
import { getUserErrorMessage } from '@/lib/mpesa/callback';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Determines a specific, customer-friendly failure reason
 */
function resolveFailureReason(dbResultDesc?: string | null, clientError?: string | null): string {
  if (dbResultDesc && dbResultDesc.trim().length > 0) {
    const formatted = getUserErrorMessage(dbResultDesc);
    if (formatted && !formatted.startsWith('Payment failed.')) {
      return formatted;
    }
    return dbResultDesc;
  }

  if (clientError && clientError.trim().length > 0) {
    const formatted = getUserErrorMessage(clientError);
    if (formatted && !formatted.startsWith('Payment failed.')) {
      return formatted;
    }
    return clientError;
  }

  return 'Payment failed or expired. Please try again.';
}

/**
 * Get the specific failure reason for an order from database records
 */
export async function getOrderFailureReason(
  orderId: string,
  fallbackError?: string
): Promise<string> {
  if (!orderId || !UUID_REGEX.test(orderId)) {
    return fallbackError || 'Payment failed or expired. Please try again.';
  }

  try {
    const latestPayment = await db
      .select({
        resultDescription: payments.resultDescription,
      })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    const resultDesc = latestPayment[0]?.resultDescription;
    return resolveFailureReason(resultDesc, fallbackError);
  } catch (err) {
    console.error('Error fetching order failure reason:', err);
    return fallbackError || 'Payment failed or expired. Please try again.';
  }
}

/**
 * Update order and payment status on failure, returning the specific failure reason
 */
export async function updatePaymentStatus(
  orderId: string,
  status: OrderStatus = 'cancelled',
  errorReason?: string
) {
  try {
    if (!orderId || !UUID_REGEX.test(orderId)) {
      return {
        success: false,
        error: 'Invalid or missing order ID',
        reason: errorReason || 'Payment failed',
      };
    }

    // 1. Fetch current order
    const currentOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrders || currentOrders.length === 0) {
      return {
        success: false,
        error: 'Order not found',
        reason: errorReason || 'Order not found',
      };
    }

    const currentOrder = currentOrders[0];

    // 2. Fetch latest payment record to obtain exact provider result description if available
    const latestPayments = await db
      .select({
        id: payments.id,
        resultDescription: payments.resultDescription,
        status: payments.status,
      })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    const latestPayment = latestPayments[0];
    const finalReason = resolveFailureReason(latestPayment?.resultDescription, errorReason);

    // 3. Transition order status if pending
    if (currentOrder.status === 'pending') {
      await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, orderId));
    }

    // 4. Mark pending payment records as cancelled / failed with the specific reason
    const paymentStatusToSet = status === 'cancelled' ? 'cancelled' : 'failed';
    await db
      .update(payments)
      .set({
        status: paymentStatusToSet,
        resultDescription: finalReason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.orderId, orderId),
          eq(payments.status, 'pending')
        )
      );

    // 5. Trigger failure email notification asynchronously
    sendPaymentFailedEmailAsync(orderId, finalReason).catch(err => {
      console.error('Failed to send payment failure email:', err);
    });

    return {
      success: true,
      orderId,
      status,
      reason: finalReason,
    };
  } catch (error) {
    console.error('Error updating order payment status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order payment status',
      reason: errorReason || 'Payment processing failed',
    };
  }
}
