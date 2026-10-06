/**
 * Payment Integration Test Script
 * 
 * This script tests the complete M-PESA payment integration:
 * 1. Database connection
 * 2. Payment creation
 * 3. Phone number normalization
 * 4. Configuration validation
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { payments } from '../drizzle/src/db/schema';
import { normalizePhoneNumber } from '../lib/mpesa/phone';
import { getMpesaConfig } from '../lib/mpesa/config';
import { desc } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  try {
    const result = await db.select().from(payments).limit(1);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testPhoneNormalization() {
  console.log('\n🔍 Testing phone number normalization...');
  const testCases = [
    { input: '0712345678', expected: '254712345678' },
    { input: '0112345678', expected: '254112345678' },
    { input: '254712345678', expected: '254712345678' },
    { input: '+254712345678', expected: '254712345678' },
  ];

  let passed = 0;
  for (const test of testCases) {
    try {
      const result = normalizePhoneNumber(test.input);
      if (result === test.expected) {
        console.log(`✅ ${test.input} → ${result}`);
        passed++;
      } else {
        console.log(`❌ ${test.input} → ${result} (expected ${test.expected})`);
      }
    } catch (error) {
      console.log(`❌ ${test.input} → Error: ${error}`);
    }
  }
  console.log(`\nPhone normalization: ${passed}/${testCases.length} tests passed`);
  return passed === testCases.length;
}

async function testConfiguration() {
  console.log('\n🔍 Testing M-PESA configuration...');
  try {
    const config = getMpesaConfig();
    console.log(`✅ Environment: ${config.environment}`);
    console.log(`✅ Shortcode: ${config.shortcode}`);
    console.log(`✅ Callback URL: ${config.callbackUrl}`);
    console.log(`✅ API URL: ${config.apiUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Configuration error:', error);
    return false;
  }
}

async function testRecentPayments() {
  console.log('\n🔍 Checking recent payments...');
  try {
    const recentPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(5);

    console.log(`✅ Found ${recentPayments.length} recent payments`);
    recentPayments.forEach((payment, index) => {
      console.log(`  ${index + 1}. ${payment.id.substring(0, 8)}... - ${payment.status} - KSh ${(payment.amount / 100).toFixed(2)}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch recent payments:', error);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   M-PESA Payment Integration Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    database: await testDatabaseConnection(),
    phoneNormalization: await testPhoneNormalization(),
    configuration: await testConfiguration(),
    recentPayments: await testRecentPayments(),
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phone Normalization: ${results.phoneNormalization ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Configuration: ${results.configuration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Recent Payments: ${results.recentPayments ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(allPassed ? 0 : 1);
}

main();
