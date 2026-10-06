/**
 * Test New Callback Processing
 *
 * This script tests processing the new callback received from Daraja
 */

import 'dotenv/config';
import { extractCallbackData, isValidCallback, formatTransactionDate } from '../lib/mpesa/callback';

const newCallback = {
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "4e7d-425c-aa3e-9b62f1dcf8a21288688",
      "CheckoutRequestID": "ws_CO_061020261419531113316693",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 2 },
          { "Name": "MpesaReceiptNumber", "Value": "UJ6E59176X" },
          { "Name": "Balance" },
          { "Name": "TransactionDate", "Value": 20261006142002 },
          { "Name": "PhoneNumber", "Value": 254113316693 }
        ]
      }
    }
  }
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Testing New Callback Processing');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('1. Testing callback validation...');
  const isValid = isValidCallback(newCallback);
  console.log(`   Validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);

  if (!isValid) {
    console.error('❌ Callback validation failed');
    process.exit(1);
  }

  console.log('\n2. Testing callback data extraction...');
  try {
    const extracted = extractCallbackData(newCallback);
    console.log('   ✅ Extraction successful');
    console.log('   Extracted data:');
    console.log(`   - Merchant Request ID: ${extracted.merchantRequestId}`);
    console.log(`   - Checkout Request ID: ${extracted.checkoutRequestId}`);
    console.log(`   - Result Code: ${extracted.resultCode}`);
    console.log(`   - Result Description: ${extracted.resultDescription}`);
    console.log(`   - M-PESA Receipt: ${extracted.mpesaReceiptNumber}`);
    console.log(`   - Transaction Date: ${extracted.transactionDate}`);
    console.log(`   - Amount: ${extracted.amount}`);
    console.log(`   - Phone Number: ${extracted.phoneNumber}`);

    console.log('\n3. Testing transaction date formatting...');
    const formattedDate = formatTransactionDate(extracted.transactionDate);
    console.log(`   Original: ${extracted.transactionDate}`);
    console.log(`   Formatted: ${formattedDate}`);
    console.log(`   Format: ${formattedDate ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   All Tests Passed ✅');
    console.log('   Callback should now be processed successfully');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    process.exit(1);
  }
}

main();
