/**
 * Email Retry Logic
 * 
 * Handles retrying failed emails with exponential backoff
 */

import { logEmailSend, getEmailLogsForOrder } from './email-logging';
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from './email';
import { getOrderById } from './mpesa/db';
import { getCustomerData } from './customer-data';
import { getOrderItems } from './order-items';

const MAX_RETRIES = parseInt(process.env.EMAIL_MAX_RETRIES || '4', 10);
const RETRY_DELAY_MS = parseInt(process.env.EMAIL_RETRY_DELAY_MS || '60000', 10); // 1 minute default

/**
 * Retry an email with exponential backoff
 * 
 * @param orderId - Order ID
 * @param type - Email type
 * @param retryCount - Current retry count
 */
export async function retryEmail(orderId: string, type: 'confirmation' | 'shipped' | 'delivered' | 'failed', retryCount: number = 0) {
  if (retryCount >= MAX_RETRIES) {
    console.error(`Max retries (${MAX_RETRIES}) exceeded for ${type} email, order: ${orderId}`);
    // Notify admin
    await notifyAdminOfFailure(orderId, type);
    return;
  }

  // Calculate delay with exponential backoff
  const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
  
  console.log(`Retrying ${type} email for order ${orderId} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

  setTimeout(async () => {
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        console.error(`Order not found for retry: ${orderId}`);
        return;
      }

      const customer = await getCustomerData(orderId);
      const items = await getOrderItems(orderId);

      let result;
      
      if (type === 'confirmation') {
        result = await sendOrderConfirmationEmail({
          customerName: customer.name,
          customerEmail: customer.email,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt.toISOString().split('T')[0],
          items,
          subtotal: (order.subtotalCents / 100).toFixed(2),
          shipping: ((order.shippingCents || 0) / 100).toFixed(2),
          tax: ((order.taxCents || 0) / 100).toFixed(2),
          total: (order.totalCents / 100).toFixed(2),
          shippingAddress: order.shippingAddress as any,
        });
      } else if (type === 'failed') {
        result = await sendPaymentFailedEmail({
          customerName: customer.name,
          customerEmail: customer.email,
          orderNumber: order.orderNumber,
          failureReason: 'Payment could not be processed. Please retry your payment.',
          orderId,
        });
      } else {
        console.error(`Retry not implemented for email type: ${type}`);
        return;
      }

      if (result.success) {
        await logEmailSend({
          orderId,
          type,
          status: 'sent',
          to: customer.email,
          retryCount: retryCount + 1,
        });
        console.log(`Successfully retried ${type} email for order ${orderId}`);
      } else {
        await logEmailSend({
          orderId,
          type,
          status: 'failed',
          to: customer.email,
          error: result.error instanceof Error ? result.error.message : 'Unknown error',
          retryCount: retryCount + 1,
        });
        // Retry again
        await retryEmail(orderId, type, retryCount + 1);
      }
    } catch (error) {
      console.error(`Error during retry for ${type} email:`, error);
      await logEmailSend({
        orderId,
        type,
        status: 'failed',
        to: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: retryCount + 1,
      });
      // Retry again
      await retryEmail(orderId, type, retryCount + 1);
    }
  }, delay);
}

/**
 * Notify admin of email failure after max retries
 * 
 * @param orderId - Order ID
 * @param type - Email type
 */
async function notifyAdminOfFailure(orderId: string, type: string) {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('No admin email configured for failure notifications');
    return;
  }

  // In production, you would send an actual email to admin
  console.error(`ADMIN ALERT: Failed to send ${type} email for order ${orderId} after ${MAX_RETRIES} retries`);
  
  // You could implement an admin notification email here
  // For now, just logging
}

/**
 * Check for failed emails and trigger retries
 * This should be called periodically (e.g., via cron job)
 */
export async function checkAndRetryFailedEmails() {
  const { getFailedEmails } = await import('./email-logging');
  const failedEmails = await getFailedEmails(50);

  for (const log of failedEmails) {
    const retryCount = log.retryCount || 0;
    if (retryCount < MAX_RETRIES) {
      await retryEmail(log.orderId || '', log.type as any, retryCount);
    }
  }
}
