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

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const STORE_NAME = 'Luxe Jewelry';
const STORE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstore.com';

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

    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `Order Confirmed - ${data.orderNumber}`,
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

    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `Your Order Has Shipped - ${data.orderNumber}`,
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

    const { data: resendData, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to: [data.customerEmail],
      subject: `Order Delivered - ${data.orderNumber}`,
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
