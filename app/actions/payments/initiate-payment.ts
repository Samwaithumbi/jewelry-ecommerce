'use server';

/**
 * Server Action: Initiate M-PESA Payment
 * 
 * This server action handles the initiation of M-PESA payments.
 * It provides a secure server-side interface for the frontend.
 * 
 * SECURITY:
 * - Runs on server only
 * - Validates all inputs
 * - Amount is retrieved from database
 * - Phone number is normalized
 */

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
 * Input validation schema
 */
const initiatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
});

/**
 * Initiate M-PESA payment
 */
export async function initiateMpesaPayment(formData: FormData) {
  let lockAcquired = false;
  let lockKey = '';

  try {
    // Extract and validate form data
    const orderId = formData.get('orderId') as string;
    const phoneNumber = formData.get('phoneNumber') as string;

    const validatedData = initiatePaymentSchema.parse({
      orderId,
      phoneNumber,
    });

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(validatedData.phoneNumber);

    // F-10: Rate limit per phone number (max 3 STK pushes per 10 minutes)
    try {
      const phoneRateLimitKey = `ratelimit:stk:phone:${normalizedPhone}`;
      const count = await redis.incr(phoneRateLimitKey);
      if (count === 1) {
        await redis.expire(phoneRateLimitKey, 600); // 10 minutes
      }
      if (count > 3) {
        throw new PaymentRateLimitError('Too many payment requests for this phone number. Please wait 10 minutes.');
      }
    } catch (rateErr) {
      if (rateErr instanceof PaymentRateLimitError) throw rateErr;
      console.warn('[STK Push] Redis rate limit check failed, continuing:', rateErr);
    }

    // F-06: Distributed Redis lock to prevent double-click duplicate payments
    lockKey = `order:${validatedData.orderId}:paying`;
    try {
      const acquired = await redis.set(lockKey, '1', { nx: true, ex: 30 });
      if (!acquired) {
        throw new PaymentPendingError(validatedData.orderId);
      }
      lockAcquired = true;
    } catch (lockErr) {
      if (lockErr instanceof PaymentPendingError) throw lockErr;
      console.warn('[STK Push] Redis lock error, proceeding:', lockErr);
    }

    // F-04: Fetch server session and pass userId for authorization check
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id;

    // Verify order is payable and authorized
    const order = await verifyOrderPayable(validatedData.orderId, sessionUserId);

    // Create payment record
    const payment = await createPayment(
      validatedData.orderId,
      PaymentProvider.MPESA,
      order.totalCents,
      normalizedPhone
    );

    // Initiate STK Push
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

    return {
      success: true,
      paymentId: payment.id,
      checkoutRequestId: stkPushResponse.CheckoutRequestID,
      merchantRequestId: stkPushResponse.MerchantRequestID,
      message: 'STK Push initiated successfully. Please check your phone.',
    };

  } catch (error) {
    // If lock was acquired but initiation failed before STK push, release lock early
    if (lockAcquired && lockKey) {
      try {
        await redis.del(lockKey);
      } catch (delErr) {
        console.warn('Failed to release lock on error:', delErr);
      }
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Invalid request data',
      };
    }

    if (error instanceof InvalidPhoneNumberError) {
      return toErrorResponse(error);
    }

    if (error instanceof OrderNotFoundError) {
      return toErrorResponse(error);
    }

    if (error instanceof OrderAlreadyPaidError) {
      return toErrorResponse(error);
    }

    if (error instanceof PaymentPendingError) {
      return toErrorResponse(error);
    }

    if (error instanceof PaymentRateLimitError) {
      return toErrorResponse(error);
    }

    if (error instanceof InvalidAmountError) {
      return toErrorResponse(error);
    }

    if (error instanceof MpesaConfigError) {
      return toErrorResponse(error);
    }

    console.error('STK Push error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
