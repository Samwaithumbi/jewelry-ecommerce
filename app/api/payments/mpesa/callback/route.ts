/**
 * M-PESA Callback API Endpoint
 * 
 * POST /api/payments/mpesa/callback
 * 
 * This endpoint receives payment callbacks from Safaricom Daraja.
 * It processes the callback, updates the payment status, and updates the order.
 * 
 * CRITICAL: This endpoint must be idempotent. Daraja may send duplicate callbacks.
 * 
 * SECURITY:
 * - Callback structure is validated before processing
 * - Database transactions ensure consistency
 * - Idempotency prevents duplicate payment processing
 * - Sensitive callback data is not logged
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isValidCallback,
  extractCallbackData,
  isSuccessfulCallback,
  isCancelledCallback,
  getUserErrorMessage,
} from '@/lib/mpesa/callback';
import { processPaymentCallback } from '@/lib/mpesa/db';
import { InvalidCallbackError, DuplicateCallbackError, toErrorResponse } from '@/lib/mpesa/errors';

/**
 * POST handler for Daraja callbacks
 */
export async function POST(request: NextRequest) {
  try {
    // Parse callback body
    const callback = await request.json();

    // Validate callback structure
    if (!isValidCallback(callback)) {
      console.error('Invalid callback structure received');
      return NextResponse.json(
        { success: false, error: 'Invalid callback structure' },
        { status: 400 }
      );
    }

    // Extract callback data
    const callbackData = extractCallbackData(callback);

    console.log('Processing callback:', {
      checkoutRequestId: callbackData.checkoutRequestId,
      merchantRequestId: callbackData.merchantRequestId,
      resultCode: callbackData.resultCode,
    });

    // Process callback (idempotent)
    try {
      const payment = await processPaymentCallback(callbackData);

      console.log('Callback processed successfully:', {
        paymentId: payment.id,
        status: payment.status,
      });

      // Return success response to Daraja
      return NextResponse.json({
        ResultCode: '0',
        ResultDesc: 'Callback processed successfully',
      });

    } catch (error) {
      // Handle duplicate callback (idempotency)
      if (error instanceof DuplicateCallbackError) {
        console.log('Duplicate callback received, ignoring:', {
          checkoutRequestId: callbackData.checkoutRequestId,
        });

        // Still return success to Daraja (don't retry)
        return NextResponse.json({
          ResultCode: '0',
          ResultDesc: 'Callback already processed',
        });
      }

      // Re-throw other errors
      throw error;
    }

  } catch (error) {
    // Handle invalid callback errors
    if (error instanceof InvalidCallbackError) {
      console.error('Invalid callback:', error.message);
      return NextResponse.json(
        { success: false, error: 'Invalid callback' },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    console.error('Callback processing error:', error);
    
    // Return error to Daraja (they may retry)
    return NextResponse.json(
      {
        ResultCode: '1',
        ResultDesc: 'Callback processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler (for testing/debugging)
 * 
 * NOTE: This should be disabled in production or protected with authentication.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'M-PESA callback endpoint is active',
    method: 'POST',
    purpose: 'Receives payment callbacks from Safaricom Daraja',
  });
}
