/**
 * Phone Number Normalization Tests
 * 
 * Run these tests to verify phone number normalization logic.
 * Execute with: npx tsx lib/mpesa/phone.test.ts
 */

import { normalizePhoneNumber, isValidPhoneNumber, maskPhoneNumber, getCarrier } from './phone';
import { InvalidPhoneNumberError } from './errors';

// Test cases
const testCases = [
  // Valid 07 numbers
  { input: '0712345678', expected: '254712345678', description: 'Valid 07 number' },
  { input: '0722345678', expected: '254722345678', description: 'Valid 07 number (different prefix)' },
  { input: '0755123456', expected: '254755123456', description: 'Valid 07 number (Safaricom)' },
  
  // Valid 01 numbers
  { input: '0112345678', expected: '254112345678', description: 'Valid 01 number' },
  { input: '0145123456', expected: '254145123456', description: 'Valid 01 number (Telkom)' },
  
  // Valid +254 numbers
  { input: '+254712345678', expected: '254712345678', description: 'Valid +254 number' },
  { input: '+254722345678', expected: '254722345678', description: 'Valid +254 number (different prefix)' },
  
  // Valid 254 numbers (without +)
  { input: '254712345678', expected: '254712345678', description: 'Valid 254 number' },
  { input: '254722345678', expected: '254722345678', description: 'Valid 254 number (different prefix)' },
  { input: '254112345678', expected: '254112345678', description: 'Valid 2541 number' },
  
  // Numbers with spaces
  { input: '07 12 34 56 78', expected: '254712345678', description: 'Number with spaces' },
  { input: '+254 712 345 678', expected: '254712345678', description: 'International number with spaces' },
  
  // Numbers with dashes
  { input: '0712-345-678', expected: '254712345678', description: 'Number with dashes' },
];

const invalidTestCases = [
  { input: '', description: 'Empty string' },
  { input: '12345678', description: 'Too short' },
  { input: '12345678901234', description: 'Too long' },
  { input: '0812345678', description: 'Invalid prefix 08' },
  { input: '0912345678', description: 'Invalid prefix 09' },
  { input: '254812345678', description: 'Invalid international prefix 2548' },
  { input: 'abcdefghij', description: 'Alphabetic input' },
  { input: '07123456789', description: 'Too many digits' },
  { input: '07123456', description: 'Too few digits' },
  { input: '2547123456789', description: 'International too long' },
  { input: '123', description: 'Way too short' },
];

function runTests() {
  console.log('🧪 Running Phone Number Normalization Tests\n');
  
  let passed = 0;
  let failed = 0;

  // Test valid numbers
  console.log('✅ Valid Number Tests:');
  testCases.forEach(({ input, expected, description }) => {
    try {
      const result = normalizePhoneNumber(input);
      if (result === expected) {
        console.log(`  ✓ ${description}: "${input}" → "${result}"`);
        passed++;
      } else {
        console.log(`  ✗ ${description}: "${input}" → "${result}" (expected "${expected}")`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ ${description}: "${input}" threw error: ${error}`);
      failed++;
    }
  });

  // Test invalid numbers
  console.log('\n❌ Invalid Number Tests:');
  invalidTestCases.forEach(({ input, description }) => {
    try {
      normalizePhoneNumber(input);
      console.log(`  ✗ ${description}: "${input}" should have thrown error`);
      failed++;
    } catch (error) {
      if (error instanceof InvalidPhoneNumberError) {
        console.log(`  ✓ ${description}: "${input}" correctly threw InvalidPhoneNumberError`);
        passed++;
      } else {
        console.log(`  ✗ ${description}: "${input}" threw unexpected error: ${error}`);
        failed++;
      }
    }
  });

  // Test isValidPhoneNumber
  console.log('\n🔍 isValidPhoneNumber Tests:');
  const validPhoneTests = [
    { input: '0712345678', expected: true },
    { input: 'invalid', expected: false },
    { input: '', expected: false },
  ];
  
  validPhoneTests.forEach(({ input, expected }) => {
    const result = isValidPhoneNumber(input);
    if (result === expected) {
      console.log(`  ✓ isValidPhoneNumber("${input}") = ${result}`);
      passed++;
    } else {
      console.log(`  ✗ isValidPhoneNumber("${input}") = ${result} (expected ${expected})`);
      failed++;
    }
  });

  // Test maskPhoneNumber
  console.log('\n🎭 maskPhoneNumber Tests:');
  const maskedTests = [
    { input: '254712345678', expected: '2547***45678' },
    { input: '254722345678', expected: '2547***45678' },
  ];
  
  maskedTests.forEach(({ input, expected }) => {
    const result = maskPhoneNumber(input);
    if (result === expected) {
      console.log(`  ✓ maskPhoneNumber("${input}") = "${result}"`);
      passed++;
    } else {
      console.log(`  ✗ maskPhoneNumber("${input}") = "${result}" (expected "${expected}")`);
      failed++;
    }
  });

  // Test getCarrier
  console.log('\n📱 getCarrier Tests:');
  const carrierTests = [
    { input: '254112345678', expected: 'Telkom Kenya' },
    { input: '254712345678', expected: 'Safaricom' },
    { input: '254720123456', expected: 'Airtel' },
  ];
  
  carrierTests.forEach(({ input, expected }) => {
    const result = getCarrier(input);
    if (result === expected) {
      console.log(`  ✓ getCarrier("${input}") = "${result}"`);
      passed++;
    } else {
      console.log(`  ✗ getCarrier("${input}") = "${result}" (expected "${expected}")`);
      failed++;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${passed + failed} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
