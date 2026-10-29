/**
 * Email Service
 * 
 * Handles sending transactional emails using Resend
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import OrderConfirmedEmail from '@/components/templates/order-confirmed';
import OrderShippedEmail from '@/components/templates/order-shipped';
import OrderDeliveredEmail from '@/components/templates/order-delivered';
import CustomRequestEmail from '@/components/templates/custom-request';
import PaymentFailedEmail from '@/components/templates/payment-failed';
import VerificationEmail from '@/components/templates/verification-email';
import PasswordResetEmail from '@/components/templates/password-reset-email';

function getResendClient(): Resend {
  const apiKey = (process.env.RESEND_API_KEY || (process.env as any)['RESEND_API_KEY '])?.trim();
  return new Resend(apiKey);
}

const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResendClient() as any)[prop];
  },
});

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev';
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Lumina Jewels';
const STORE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstore.com';

/**
 * In Resend sandbox mode (no verified domain) you can only send to your own
 * email. Set DEV_EMAIL_OVERRIDE in .env to your Resend account email to
 * redirect all outgoing mail there during development.
 */
function resolveRecipient(customerEmail: string, originalSubject: string): { to: string[]; subject: string } {
  const devEmail = (process.env.DEV_EMAIL_OVERRIDE || (process.env as any)['DEV_EMAIL_OVERRIDE '])?.trim();
  const cleanCustomerEmail = customerEmail?.trim() || '';

  if (devEmail) {
    return {
      to: [devEmail],
      subject: cleanCustomerEmail ? `[DEV → ${cleanCustomerEmail}] ${originalSubject}` : originalSubject,
    };
  }
  if (cleanCustomerEmail) {
    return { to: [cleanCustomerEmail], subject: originalSubject };
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Transactional email failed: recipient address is required for subject "${originalSubject}"`);
  }
  throw new Error(`Transactional email failed: no recipient email provided`);
}

interface OrderConfirmedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

interface OrderShippedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
  estimatedDelivery: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface OrderDeliveredData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  deliveryDate: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmedData) {
  try {
    const emailHtml = await render(
      OrderConfirmedEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        items: data.items,
        subtotal: data.subtotal,
        shipping: data.shipping,
        tax: data.tax,
        total: data.total,
        shippingAddress: data.shippingAddress,
      })
    );

    const { to, subject } = resolveRecipient(data.customerEmail, `Order Confirmed - ${data.orderNumber}`);
    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send order confirmation email:', error);
      return { success: false, error };
    }

    return { success: true, data: resendData };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(data: OrderShippedData) {
  try {
    const emailHtml = await render(
      OrderShippedEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        trackingUrl: data.trackingUrl,
        estimatedDelivery: data.estimatedDelivery,
        items: data.items,
      })
    );

    const { to, subject } = resolveRecipient(data.customerEmail, `Your Order Has Shipped - ${data.orderNumber}`);
    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send order shipped email:', error);
      return { success: false, error };
    }

    return { success: true, data: resendData };
  } catch (error) {
    console.error('Error sending order shipped email:', error);
    return { success: false, error };
  }
}

/**
 * Send order delivered email
 */
export async function sendOrderDeliveredEmail(data: OrderDeliveredData) {
  try {
    const emailHtml = await render(
      OrderDeliveredEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        deliveryDate: data.deliveryDate,
        items: data.items,
      })
    );

    const { to, subject } = resolveRecipient(data.customerEmail, `Order Delivered - ${data.orderNumber}`);
    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send order delivered email:', error);
      return { success: false, error };
    }

    return { success: true, data: resendData };
  } catch (error) {
    console.error('Error sending order delivered email:', error);
    return { success: false, error };
  }
}

interface CustomRequestData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  budgetMin?: string;
  budgetMax?: string;
  metalPreference?: string;
  timeline?: string;
  photoUrls?: string[];
  requestId: string;
}

interface PaymentFailedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  failureReason: string;
  orderId?: string;
}

/**
 * Send custom request notification email to admin
 */
export async function sendCustomRequestNotification(data: CustomRequestData) {
  try {
    const emailHtml = await render(
      CustomRequestEmail({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        description: data.description,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        metalPreference: data.metalPreference,
        timeline: data.timeline,
        photoUrls: data.photoUrls,
        requestId: data.requestId,
      })
    );

    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to: ['admin@luminajewelry.com'], // Replace with actual admin email
      subject: `New Custom Jewelry Request - ${data.customerName}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send custom request notification:', error);
      return { success: false, error };
    }

    return { success: true, data: resendData };
  } catch (error) {
    console.error('Failed to send custom request notification:', error);
    return { success: false, error };
  }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(data: PaymentFailedData) {
  try {
    const emailHtml = await render(
      PaymentFailedEmail({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        failureReason: data.failureReason,
        storeUrl: STORE_URL,
        orderId: data.orderId,
      })
    );

    const { to, subject } = resolveRecipient(data.customerEmail, `Payment Failed - ${data.orderNumber}`);
    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send payment failed email:', error);
      return { success: false, error };
    }

    return { success: true, data: resendData };
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return { success: false, error };
  }
}

/**
 * Async wrapper for sending order confirmation email
 * Designed to be called non-blocking after payment success
 */
export async function sendOrderConfirmationEmailAsync(orderId: string) {
  try {
    const { getOrderById } = await import('@/lib/mpesa/db');
    const { getCustomerData } = await import('@/lib/customer-data');
    const { getOrderItems } = await import('@/lib/order-items');
    const { db } = await import('@/lib/db');
    const { orders } = await import('@/drizzle/src/db/schema');
    const { eq } = await import('drizzle-orm');
    const { logEmailSend } = await import('@/lib/emails/email-logging');

    const order = await getOrderById(orderId);
    if (!order) {
      console.error('Order not found for confirmation email:', orderId);
      return;
    }

    const customer = await getCustomerData(orderId);
    const items = await getOrderItems(orderId);

    // Check if already sent (idempotency)
    if ((order as any).emailConfirmationSent) {
      return;
    }

    // Log email attempt
    await logEmailSend({
      orderId,
      type: 'confirmation',
      status: 'retrying',
      to: customer.email,
    });

    const result = await sendOrderConfirmationEmail({
      customerName: customer.name,
      customerEmail: customer.email,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString().split('T')[0],
      items,
      subtotal: `KSh ${(order.subtotalCents / 100).toLocaleString()}`,
      shipping: `KSh ${((order.shippingCents || 0) / 100).toLocaleString()}`,
      tax: `KSh ${((order.taxCents || 0) / 100).toLocaleString()}`,
      total: `KSh ${(order.totalCents / 100).toLocaleString()}`,
      shippingAddress: order.shippingAddress as any,
    });

    if (result.success) {
      // Update order with email sent timestamp
      await db
        .update(orders)
        .set({ emailConfirmationSent: new Date() } as any)
        .where(eq(orders.id, orderId));

      // Log success
      await logEmailSend({
        orderId,
        type: 'confirmation',
        status: 'sent',
        to: customer.email,
      });
    } else {
      // Log failure
      await logEmailSend({
        orderId,
        type: 'confirmation',
        status: 'failed',
        to: customer.email,
        error: result.error instanceof Error ? result.error.message : 'Unknown error',
      });

      console.error('Failed to send order confirmation email:', result.error);

      // Trigger retry
      const { retryEmail } = await import('@/lib/emails/email-retry');
      retryEmail(orderId, 'confirmation').catch(err => {
        console.error('Failed to trigger email retry:', err);
      });
    }
  } catch (error) {
    console.error('Error in sendOrderConfirmationEmailAsync:', error);
  }
}

/**
 * Async wrapper for sending payment failed email
 * Designed to be called non-blocking after payment failure or cancellation
 */
export async function sendPaymentFailedEmailAsync(orderId: string, failureReason?: string) {
  try {
    const { getOrderById } = await import('@/lib/mpesa/db');
    const { getCustomerData } = await import('@/lib/customer-data');
    const { db } = await import('@/lib/db');
    const { emailLogs } = await import('@/drizzle/src/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { logEmailSend } = await import('@/lib/emails/email-logging');

    const order = await getOrderById(orderId);
    if (!order) {
      console.error('Order not found for failure email:', orderId);
      return;
    }

    const customer = await getCustomerData(orderId);
    if (!customer.email) {
      console.warn('No customer email found for order failure notification:', orderId);
      return;
    }

    // Check if already sent (idempotency)
    const existingSentLogs = await db
      .select({ id: emailLogs.id })
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.orderId, orderId),
          eq(emailLogs.type, 'failed'),
          eq(emailLogs.status, 'sent')
        )
      )
      .limit(1);

    if (existingSentLogs.length > 0) {
      return;
    }

    // Log email attempt
    await logEmailSend({
      orderId,
      type: 'failed',
      status: 'retrying',
      to: customer.email,
    });

    const result = await sendPaymentFailedEmail({
      customerName: customer.name,
      customerEmail: customer.email,
      orderNumber: order.orderNumber,
      failureReason: failureReason || 'Payment could not be processed. Please try again.',
      orderId,
    });

    if (result.success) {
      // Log success
      await logEmailSend({
        orderId,
        type: 'failed',
        status: 'sent',
        to: customer.email,
      });
    } else {
      // Log failure
      await logEmailSend({
        orderId,
        type: 'failed',
        status: 'failed',
        to: customer.email,
        error: result.error instanceof Error ? result.error.message : (typeof result.error === 'object' ? JSON.stringify(result.error) : 'Unknown error'),
      });

      console.error('Failed to send payment failed email:', result.error);

      // Trigger retry
      const { retryEmail } = await import('@/lib/emails/email-retry');
      retryEmail(orderId, 'failed').catch(err => {
        console.error('Failed to trigger email retry for failed payment:', err);
      });
    }
  } catch (error) {
    console.error('Error in sendPaymentFailedEmailAsync:', error);
  }
}

export interface VerificationEmailData {
  customerEmail: string;
  customerName?: string;
  token: string;
}

export async function sendAccountVerificationEmail(data: VerificationEmailData) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.customerEmail)}`;
    const originalSubject = 'Verify your email address - Lumina Jewels';
    const { to, subject } = resolveRecipient(data.customerEmail, originalSubject);

    const emailHtml = await render(
      VerificationEmail({
        customerName: data.customerName,
        verificationUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: emailHtml,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending account verification email:', error);
    return { success: false, error };
  }
}

export interface PasswordResetEmailData {
  customerEmail: string;
  customerName?: string;
  token: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.customerEmail)}`;
    const originalSubject = 'Reset your password - Lumina Jewels';
    const { to, subject } = resolveRecipient(data.customerEmail, originalSubject);

    const emailHtml = await render(
      PasswordResetEmail({
        customerName: data.customerName,
        resetUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: emailHtml,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}


