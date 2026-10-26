/**
 * Customer Data Helper
 * 
 * Fetches customer email and name from orders safely
 */

import { db } from '@/lib/db';
import { users } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';
import { getOrderById } from '@/lib/mpesa/db';

export interface CustomerData {
  email: string;
  name: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch customer data (email and name) for an order
 * Handles both registered users and guest orders safely
 * 
 * @param orderId - Order ID
 * @returns Customer data with email and name
 */
export async function getCustomerData(orderId: string): Promise<CustomerData> {
  const order = await getOrderById(orderId);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const address = (order.shippingAddress as any) || {};
  let email = (address.email || '').trim();
  let name = address.name || address.fullName || '';

  // If email found on shipping address, use it immediately
  if (email) {
    return {
      email,
      name: name || 'Valued Customer',
    };
  }

  // Otherwise, if order has a valid userId, look up from users table
  if (order.userId && typeof order.userId === 'string' && UUID_REGEX.test(order.userId)) {
    try {
      const userData = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);

      if (userData && userData.length > 0 && userData[0].email) {
        return {
          email: userData[0].email.trim(),
          name: name || userData[0].name || 'Valued Customer',
        };
      }
    } catch (err) {
      console.warn('[CustomerData] Could not fetch user by ID:', err);
    }
  }

  return {
    email: email || process.env.DEV_EMAIL_OVERRIDE || '',
    name: name || 'Valued Customer',
  };
}
