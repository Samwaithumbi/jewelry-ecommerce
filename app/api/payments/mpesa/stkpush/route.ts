/**
 * M-PESA STK Push API Endpoint
 * 
 * POST /api/payments/mpesa/stkpush
 * 
 * This endpoint initiates an M-PESA STK Push payment.
 * It validates the request, verifies the order, and sends the STK Push to Daraja.
 * 
 * SECURITY:
 * - Amount is retrieved from database, never from client
 * - Phone number is normalized and validated
 * - Order authorization is checked
 * - All sensitive operations happen server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initiateStkPush } from '@/lib/mpesa/stk-push';
import { normalizePhoneNumber } from '@/lib/mpesa/phone';
import {
  createPayment,
  updatePaymentWithStkPushIdentifiers,
  verifyOrderPayable,
} from '@/lib/mpesa/db';
import { PaymentProvider } from '@/lib/mpesa/types';
import {
  InvalidPhoneNumberError,
  OrderNotFoundError,
  OrderAlreadyPaidError,
  InvalidAmountError,
  MpesaConfigError,
  PaymentPendingError,
  PaymentRateLimitError,
  toErrorResponse,
} from '@/lib/mpesa/errors';
import { redis } from '@/lib/redis';

/**
 * Request validation schema
 */
const initiatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
});

/**
 * POST handler for STK Push initiation
 */
export async function POST(request: NextRequest) {
  let lockAcquired = false;
  let lockKey = '';

  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // F-10: Rate limit per IP (max 5 STK pushes per minute)
    try {
      const ipRateKey = `ratelimit:stk:ip:${clientIp}`;
      const ipCount = await redis.incr(ipRateKey);
      if (ipCount === 1) {
        await redis.expire(ipRateKey, 60);
      }
      if (ipCount > 7) {
        throw new PaymentRateLimitError('Too many payment initiation requests from this IP. Please wait a minute.');
      }
    } catch (ipRateErr) {
      if (ipRateErr instanceof PaymentRateLimitError) throw ipRateErr;
      console.warn('[STK Push] IP rate limit check failed, continuing:', ipRateErr);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = initiatePaymentSchema.parse(body);

    const { orderId, phoneNumber } = validatedData;

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // F-10: Rate limit per phone (max 3 STK pushes per 10 minutes)
    try {
      const phoneRateKey = `ratelimit:stk:phone:${normalizedPhone}`;
      const phoneCount = await redis.incr(phoneRateKey);
      if (phoneCount === 1) {
        await redis.expire(phoneRateKey, 600);
      }
      if (phoneCount > 3) {
        throw new PaymentRateLimitError('Too many payment requests for this phone number. Please wait 10 minutes.');
      }
    } catch (phoneRateErr) {
      if (phoneRateErr instanceof PaymentRateLimitError) throw phoneRateErr;
      console.warn('[STK Push] Phone rate limit check failed, continuing:', phoneRateErr);
    }

    // F-06: Distributed Redis lock to prevent double-click duplicate payments
    lockKey = `order:${orderId}:paying`;
    try {
      const acquired = await redis.set(lockKey, '1', { nx: true, ex: 30 });
      if (!acquired) {
        throw new PaymentPendingError(orderId);
      }
      lockAcquired = true;
    } catch (lockErr) {
      if (lockErr instanceof PaymentPendingError) throw lockErr;
      console.warn('[STK Push] Redis lock error, proceeding:', lockErr);
    }

    // Verify order is payable and authorized
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;

    const order = await verifyOrderPayable(orderId, sessionUserId);

    // Create payment record with PENDING status
    const payment = await createPayment(
      orderId,
      PaymentProvider.MPESA,
      order.totalCents,
      normalizedPhone
    );

    // Initiate STK Push with Daraja
    const stkPushResponse = await initiateStkPush(
      order.totalCents,
      normalizedPhone,
      order.orderNumber,
      'Jewelry Purchase'
    );

    // Update payment with Daraja identifiers
    await updatePaymentWithStkPushIdentifiers(
      payment.id,
      stkPushResponse.MerchantRequestID,
      stkPushResponse.CheckoutRequestID
    );

    // Return success response
    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutRequestId: stkPushResponse.CheckoutRequestID,
      merchantRequestId: stkPushResponse.MerchantRequestID,
      message: 'STK Push initiated successfully. Please check your phone.',
    });

  } catch (error) {
    if (lockAcquired && lockKey) {
      try {
        await redis.del(lockKey);
      } catch (delErr) {
        console.warn('Failed to release lock on error:', delErr);
      }
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      );
    }

    // Handle M-PESA specific errors
    if (error instanceof InvalidPhoneNumberError) {
      return NextResponse.json(toErrorResponse(error), { status: 400 });
    }

    if (error instanceof OrderNotFoundError) {
      return NextResponse.json(toErrorResponse(error), { status: 404 });
    }

    if (error instanceof OrderAlreadyPaidError) {
      return NextResponse.json(toErrorResponse(error), { status: 400 });
    }

    if (error instanceof PaymentPendingError) {
      return NextResponse.json(toErrorResponse(error), { status: 409 });
    }

    if (error instanceof PaymentRateLimitError) {
      return NextResponse.json(toErrorResponse(error), { status: 429 });
    }

    if (error instanceof InvalidAmountError) {
      return NextResponse.json(toErrorResponse(error), { status: 400 });
    }

    if (error instanceof MpesaConfigError) {
      return NextResponse.json(toErrorResponse(error), { status: 500 });
    }

    // Handle unexpected errors
    console.error('STK Push error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

