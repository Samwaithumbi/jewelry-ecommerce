/**
 * Order Items Helper
 * 
 * Fetches order items with product details for email templates
 */

import { db } from '@/lib/db';
import { orderItems, products, productImages } from '@/drizzle/src/db/schema';
import { eq } from 'drizzle-orm';

export interface OrderItemForEmail {
  name: string;
  quantity: number;
  price: string;
  imageUrl?: string;
}

/**
 * Fetch order items with product details for email templates
 * 
 * @param orderId - Order ID
 * @returns Array of order items with product names and prices
 */
export async function getOrderItems(orderId: string): Promise<OrderItemForEmail[]> {
  const items = await db
    .select({
      productName: products.name,
      quantity: orderItems.qty,
      priceCents: orderItems.priceCents,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  return items.map(item => ({
    name: item.productName,
    quantity: item.quantity,
    price: `KSh ${(item.priceCents / 100).toLocaleString()}`,
  }));
}

/**
 * Fetch order items with product images for enhanced email templates
 * 
 * @param orderId - Order ID
 * @returns Array of order items with product names, prices, and images
 */
export async function getOrderItemsWithImages(orderId: string): Promise<OrderItemForEmail[]> {
  const items = await db
    .select({
      productName: products.name,
      quantity: orderItems.qty,
      priceCents: orderItems.priceCents,
      imageUrl: productImages.url,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .where(eq(orderItems.orderId, orderId));

  // Group by product and get primary image
  const grouped = new Map<string, OrderItemForEmail>();
  
  for (const item of items) {
    const key = item.productName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: item.productName,
        quantity: item.quantity,
        price: `KSh ${(item.priceCents / 100).toLocaleString()}`,
        imageUrl: item.imageUrl || undefined,
      });
    }
  }

  return Array.from(grouped.values());
}
