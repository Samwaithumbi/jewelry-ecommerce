/**
 * Force Payment Confirmation Script
 * 
 * This script manually updates a payment status to "success" in the database.
 * Use this ONLY when you have confirmed the payment was made via M-PESA
 * but the callback failed.
 * 
 * Usage:
 * npx tsx scripts/force-confirm-payment.ts <paymentId>
 * 
 * Example:
 * npx tsx scripts/force-confirm-payment.ts 4709a023-e424-4484-b970-ecbe63b06dde
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { payments, orders } from '../drizzle/src/db/schema';
import { eq } from 'drizzle-orm';

const paymentId = process.argv[2];

if (!paymentId) {
  console.error('❌ Payment ID is required');
  console.log('Usage: npx tsx scripts/force-confirm-payment.ts <paymentId>');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔍 Querying payment:', paymentId);

    // Get payment record
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);

    if (!payment) {
      console.error('❌ Payment not found');
      process.exit(1);
    }

    console.log('Current payment status:', payment.status);
    console.log('Order ID:', payment.orderId);
    console.log('Amount:', payment.amount / 100);

    // If already successful, nothing to do
    if (payment.status === 'success') {
      console.log('✅ Payment already confirmed');
      process.exit(0);
    }

    console.log('⚠️  WARNING: This will manually mark the payment as successful');
    console.log('⚠️  Only use this if you have confirmed payment was made via M-PESA');
    
    // Update payment status
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: 'success',
        mpesaReceiptNumber: 'MANUAL_CONFIRM_' + Date.now(),
        resultCode: '0',
        resultDescription: 'Manually confirmed after callback failure',
        transactionDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    console.log('✅ Payment updated to success');
    console.log('Payment ID:', updatedPayment.id);
    console.log('M-PESA Receipt:', updatedPayment.mpesaReceiptNumber);

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: 'confirmed',
      })
      .where(eq(orders.id, payment.orderId))
      .returning();

    console.log('✅ Order updated to confirmed');
    console.log('Order ID:', updatedOrder.id);
    console.log('Order Number:', updatedOrder.orderNumber);

    console.log('🎉 Payment and order successfully confirmed!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
