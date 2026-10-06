/**
 * Customer Data Helper
 * 
 * Fetches customer email and name from orders
 */

import { db } from '@/lib/db';
import { orders, users } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';
import { getOrderById } from '@/lib/mpesa/db';

export interface CustomerData {
  email: string;
  name: string;
}

/**
 * Fetch customer data (email and name) for an order
 * Handles both registered users and guest orders
 * 
 * @param orderId - Order ID
 * @returns Customer data with email and name
 */
export async function getCustomerData(orderId: string): Promise<CustomerData> {
  const order = await getOrderById(orderId);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // If order has a userId, fetch from users table
  if (order.userId) {
    const userData = await db
      .select({
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    if (userData && userData.length > 0) {
      return {
        email: userData[0].email,
        name: userData[0].name || 'Customer',
      };
    }
  }

  // Guest order - fetch from shipping address
  const address = order.shippingAddress as any;
  return {
    email: address?.email || '',
    name: address?.name || 'Customer',
  };
}
