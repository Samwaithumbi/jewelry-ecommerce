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
  toErrorResponse,
} from '@/lib/mpesa/errors';

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

    // Verify order is payable
    const order = await verifyOrderPayable(validatedData.orderId);

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
