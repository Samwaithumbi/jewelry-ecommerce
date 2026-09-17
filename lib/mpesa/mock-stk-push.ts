/**
 * Mock M-PESA STK Push Implementation
 * 
 * This module provides mock implementations of M-PESA Daraja API calls
 * for testing without real credentials or ngrok.
 * 
 * USE CASES:
 * - Local development without real M-PESA credentials
 * - Testing payment flow without external dependencies
 * - CI/CD pipeline testing
 * 
 * NOTE: This should NEVER be used in production.
 */

import { StkPushResponse } from './types';

/**
 * Mock OAuth token response
 */
interface MockOAuthToken {
  accessToken: string;
  expiresIn: number;
}

/**
 * Mock STK Push request parameters
 */
interface MockStkPushParams {
  phoneNumber: string;
  amount: number;
  orderId: string;
}

/**
 * Generate mock OAuth token
 * 
 * Simulates Daraja OAuth token generation without real API call.
 * 
 * @returns Mock OAuth token
 */
export async function mockGetOAuthToken(): Promise<MockOAuthToken> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    accessToken: 'mock_access_token_' + Date.now(),
    expiresIn: 3599, // 1 hour minus 1 second
  };
}

/**
 * Mock STK Push initiation
 * 
 * Simulates Daraja STK Push API call without real API.
 * Returns a successful response with mock identifiers.
 * 
 * @param params - STK Push parameters
 * @returns Mock STK Push response
 */
export async function mockInitiateStkPush(
  params: MockStkPushParams
): Promise<StkPushResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const merchantRequestId = 'MOCK_MERCHANT_' + Date.now();
  const checkoutRequestId = 'MOCK_CHECKOUT_' + Date.now();

  console.log('Mock STK Push initiated:', {
    phoneNumber: params.phoneNumber,
    amount: params.amount,
    orderId: params.orderId,
    merchantRequestId,
    checkoutRequestId,
  });

  return {
    MerchantRequestID: merchantRequestId,
    CheckoutRequestID: checkoutRequestId,
    ResponseCode: '0',
    ResponseDescription: 'Success. Request accepted for processing',
    CustomerMessage: 'Success. Request accepted for processing',
  };
}

/**
 * Mock payment status check
 * 
 * Simulates checking payment status from Daraja.
 * Randomly returns success, pending, or failed for testing different scenarios.
 * 
 * @param checkoutRequestId - Checkout Request ID
 * @returns Mock payment status
 */
export async function mockCheckPaymentStatus(
  checkoutRequestId: string
): Promise<{ status: 'success' | 'pending' | 'failed'; receiptNumber?: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));

  // Randomly return different statuses for testing
  const random = Math.random();
  
  if (random < 0.6) {
    // 60% chance of success
    return {
      status: 'success',
      receiptNumber: 'MOCK_RECEIPT_' + Date.now(),
    };
  } else if (random < 0.9) {
    // 30% chance of pending
    return {
      status: 'pending',
    };
  } else {
    // 10% chance of failed
    return {
      status: 'failed',
    };
  }
}
