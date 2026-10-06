/**
 * Manual Payment Confirmation Script
 * 
 * Run this script to query Daraja and update payment status when callbacks fail.
 * 
 * Usage:
 * npx tsx scripts/manual-confirm-payment.ts <paymentId>
 * 
 * Example:
 * npx tsx scripts/manual-confirm-payment.ts 4709a023-e424-4484-b970-ecbe63b06dde
 */

import 'dotenv/config';
import { getPaymentById } from '../lib/mpesa/db';
import { queryStkPushStatus } from '../lib/mpesa/stk-push';
import { processPaymentCallback } from '../lib/mpesa/db';

const paymentId = process.argv[2];

if (!paymentId) {
  console.error('❌ Payment ID is required');
  console.log('Usage: npx tsx scripts/manual-confirm-payment.ts <paymentId>');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔍 Querying payment:', paymentId);

    // Get payment record
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      console.error('❌ Payment not found');
      process.exit(1);
    }

    console.log('Current payment status:', payment.status);
    console.log('Checkout Request ID:', payment.checkoutRequestId);

    // If already successful, nothing to do
    if (payment.status === 'success') {
      console.log('✅ Payment already confirmed');
      process.exit(0);
    }

    // If no checkout request ID, cannot query
    if (!payment.checkoutRequestId) {
      console.error('❌ No checkout request ID available for querying');
      process.exit(1);
    }

    console.log('📡 Querying Daraja...');

    // Query status from Daraja
    const queryResponse = await queryStkPushStatus(payment.checkoutRequestId);

    console.log('Daraja response:', JSON.stringify(queryResponse, null, 2));

    // Extract result code
    const resultCode = queryResponse.ResultCode;
    const resultDesc = queryResponse.ResultDesc;

    if (!resultCode) {
      console.error('❌ Could not determine payment status from Daraja');
      process.exit(1);
    }

    console.log('Result Code:', resultCode);
    console.log('Result Description:', resultDesc);

    // Process callback data
    const callbackData = {
      merchantRequestId: payment.merchantRequestId || '',
      checkoutRequestId: payment.checkoutRequestId,
      resultCode: resultCode.toString(),
      resultDescription: resultDesc || '',
      mpesaReceiptNumber: queryResponse.MpesaReceiptNumber,
      transactionDate: queryResponse.TransactionDate,
      amount: queryResponse.Amount,
      phoneNumber: queryResponse.PhoneNumber,
    };

    console.log('🔄 Updating payment status...');

    // Update payment
    const updatedPayment = await processPaymentCallback(callbackData);

    console.log('✅ Payment updated successfully');
    console.log('New status:', updatedPayment.status);
    console.log('M-PESA Receipt:', updatedPayment.mpesaReceiptNumber);

    if (updatedPayment.status === 'success') {
      console.log('🎉 Payment confirmed! Order should now be updated.');
    } else {
      console.log('⚠️ Payment status:', updatedPayment.status);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
