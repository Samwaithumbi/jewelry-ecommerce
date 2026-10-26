
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
import { redis } from '@/lib/redis';

// Safaricom Daraja production callback IP subnets/ranges
const SAFARICOM_PROD_IPS = [
  '196.201.214.',
  '196.201.213.',
  '41.223.56.',
];

/**
 * Validates whether the incoming request originated from Safaricom.
 * In sandbox or local development, IP check is bypassed.
 */
function isSafaricomIpAllowed(clientIp: string): boolean {
  const isSandbox = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase() === 'sandbox';
  const isDev = process.env.NODE_ENV !== 'production';

  // Allow in non-production or sandbox environments
  if (isSandbox || isDev) {
    return true;
  }

  // Custom allowed IPs configured via env (comma-separated)
  const customIps = process.env.SAFARICOM_CALLBACK_IPS
    ? process.env.SAFARICOM_CALLBACK_IPS.split(',').map(ip => ip.trim())
    : [];

  if (customIps.includes(clientIp)) {
    return true;
  }

  // Check against known Safaricom production subnets
  return SAFARICOM_PROD_IPS.some(subnet => clientIp.startsWith(subnet));
}

// In-memory fallback rate limiter in case Redis is temporarily unreachable
const fallbackRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

function isFallbackRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = fallbackRateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    fallbackRateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  fallbackRateLimitMap.set(ip, validTimestamps);
  return false;
}

/**
 * Distributed rate limiter via Upstash Redis (F-05)
 */
async function checkCallbackRateLimit(clientIp: string): Promise<boolean> {
  try {
    const key = `ratelimit:callback:${clientIp}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60);
    }
    return count > MAX_REQUESTS_PER_WINDOW;
  } catch (err) {
    console.warn('[M-Pesa Callback] Redis rate limiter unavailable, using memory fallback:', err);
    return isFallbackRateLimited(clientIp);
  }
}

/**
 * POST handler for Daraja callbacks
 */
export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // F-03: Enforce Safaricom IP Allowlist
  if (!isSafaricomIpAllowed(clientIp)) {
    console.warn(`[M-Pesa Callback Security] Blocked callback from unauthorized IP: ${clientIp}`);
    return NextResponse.json(
      { ResultCode: '1', ResultDesc: 'Unauthorized sender IP' },
      { status: 403 }
    );
  }

  // F-05: Enforce Distributed Rate Limiting
  const rateLimited = await checkCallbackRateLimit(clientIp);
  if (rateLimited) {
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

    // Safe logging (sanitized: checkoutRequestId truncated, no PII)
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
        // F-09: Generic sanitized response
        return NextResponse.json(
          { ResultCode: '1', ResultDesc: 'Amount verification failed' },
          { status: 400 }
        );
      }

      // Handle payment record not found
      if (error instanceof PaymentNotFoundError) {
        console.warn(`[M-Pesa Callback] Payment record not found for: ${sanitizedCheckoutId}`);
        // F-09: Do not reflect internal IDs or messages
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
      // F-09: Generic sanitized response to caller
      return NextResponse.json(
        { ResultCode: '1', ResultDesc: 'Invalid callback parameters' },
        { status: 400 }
      );
    }

    console.error('[M-Pesa Callback] Internal error processing callback:', error);
    
    // Return generic error to Daraja (causes standard provider retry)
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

