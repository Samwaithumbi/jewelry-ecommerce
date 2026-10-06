/**
 * Check Order Script
 * 
 * Run this to check if an order exists in the database
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { orders } from '../drizzle/src/db/schema';
import { eq } from 'drizzle-orm';

const orderId = process.argv[2];

if (!orderId) {
  console.error('❌ Order ID is required');
  console.log('Usage: npx tsx scripts/check-order.ts <orderId>');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔍 Checking order:', orderId);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      console.error('❌ Order not found in database');
      process.exit(1);
    }

    console.log('✅ Order found:');
    console.log('ID:', order.id);
    console.log('Order Number:', order.orderNumber);
    console.log('Status:', order.status);
    console.log('Total:', order.totalCents / 100);
    console.log('Created:', order.createdAt);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
