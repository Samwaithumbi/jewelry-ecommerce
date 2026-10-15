
import { NextRequest, NextResponse } from 'next/server';
import {
  isValidCallback,
  extractCallbackData,
} from '@/lib/mpesa/callback';
import { processPaymentCallback } from '@/lib/mpesa/db';
import {
  InvalidCallbackError,
  DuplicateCallbackError,
  AmountMismatchError,
  ReconciliationInconclusiveError,
  PaymentNotFoundError,
} from '@/lib/mpesa/errors';

// Sliding-window in-memory rate limiter for callback endpoint protection
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  // Periodic map cleanup
  if (rateLimitMap.size > 1000) {
    for (const [key, list] of rateLimitMap.entries()) {
      if (list.length === 0 || now - list[list.length - 1] > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  return false;
}

/**
 * POST handler for Daraja callbacks
 */
export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(clientIp)) {
    console.warn(`[M-Pesa Callback] Rate limit exceeded from IP: ${clientIp}`);
    return NextResponse.json(
      { ResultCode: '1', ResultDesc: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    let callback: unknown;
    try {
      callback = await request.json();
    } catch {
      return NextResponse.json(
        { ResultCode: '1', ResultDesc: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate callback structure
    if (!isValidCallback(callback)) {
      console.warn('[M-Pesa Callback] Invalid callback structure received');
      return NextResponse.json(
        { ResultCode: '1', ResultDesc: 'Invalid callback structure' },
        { status: 400 }
      );
    }

    // Extract callback data
    const callbackData = extractCallbackData(callback);

    // Safe logging (sanitized: no customer phone numbers or secrets)
    const sanitizedCheckoutId = callbackData.checkoutRequestId
      ? `${callbackData.checkoutRequestId.slice(0, 12)}...`
      : 'unknown';
    console.log(
      `[M-Pesa Callback] Processing notification: checkoutRequestId=${sanitizedCheckoutId}, ResultCode=${callbackData.resultCode}`
    );

    // Process callback with authoritative Daraja reconciliation
    try {
      await processPaymentCallback(callbackData);

      // Return success acknowledgement to Daraja
      return NextResponse.json({
        ResultCode: '0',
        ResultDesc: 'Callback processed and reconciled successfully',
      });

    } catch (error) {
      // Handle duplicate callback idempotently
      if (error instanceof DuplicateCallbackError) {
        console.log(`[M-Pesa Callback] Idempotent duplicate callback ignored: ${sanitizedCheckoutId}`);
        return NextResponse.json({
          ResultCode: '0',
          ResultDesc: 'Callback already processed',
        });
      }

      // Handle amount tampering or mismatch
      if (error instanceof AmountMismatchError) {
        console.error(`[M-Pesa Callback Security Alert] ${error.message}`);
        return NextResponse.json(
          { ResultCode: '1', ResultDesc: 'Amount verification failed' },
          { status: 400 }
        );
      }

      // Handle payment record not found
      if (error instanceof PaymentNotFoundError) {
        console.warn(`[M-Pesa Callback] Payment record not found for: ${sanitizedCheckoutId}`);
        return NextResponse.json(
          { ResultCode: '1', ResultDesc: 'Payment record not found' },
          { status: 404 }
        );
      }

      // Handle inconclusive query (preserve pending state in DB, instruct Daraja to retry)
      if (error instanceof ReconciliationInconclusiveError) {
        console.warn(`[M-Pesa Callback] Inconclusive reconciliation for ${sanitizedCheckoutId}: ${error.message}`);
        return NextResponse.json(
          { ResultCode: '1', ResultDesc: 'Reconciliation inconclusive, pending retry' },
          { status: 503 }
        );
      }

      // Re-throw unexpected errors
      throw error;
    }

  } catch (error) {
    if (error instanceof InvalidCallbackError) {
      console.warn('[M-Pesa Callback] Invalid callback validation error:', error.message);
      return NextResponse.json(
        { ResultCode: '1', ResultDesc: error.message },
        { status: 400 }
      );
    }

    console.error('[M-Pesa Callback] Internal error processing callback:', error);
    
    // Return error to Daraja (causes standard provider retry)
    return NextResponse.json(
      {
        ResultCode: '1',
        ResultDesc: 'Internal error processing callback',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - disabled in production for security
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  );
}
