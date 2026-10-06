/**
 * Check Recent Payments Script
 * 
 * Run this to check recent payments in the database
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { payments } from '../drizzle/src/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  try {
    console.log('🔍 Checking recent payments...');

    const recentPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(10);

    if (recentPayments.length === 0) {
      console.log('❌ No payments found in database');
      process.exit(0);
    }

    console.log(`✅ Found ${recentPayments.length} recent payments:\n`);

    recentPayments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ID: ${payment.id}`);
      console.log(`   Order ID: ${payment.orderId}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: KSh ${(payment.amount / 100).toLocaleString()}`);
      console.log(`   Phone: ${payment.phoneNumber}`);
      console.log(`   Checkout Request ID: ${payment.checkoutRequestId || 'N/A'}`);
      console.log(`   Merchant Request ID: ${payment.merchantRequestId || 'N/A'}`);
      console.log(`   M-PESA Receipt: ${payment.mpesaReceiptNumber || 'N/A'}`);
      console.log(`   Result Code: ${payment.resultCode || 'N/A'}`);
      console.log(`   Result Description: ${payment.resultDescription || 'N/A'}`);
      console.log(`   Created: ${payment.createdAt}`);
      console.log(`   Expires: ${payment.expiresAt || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
