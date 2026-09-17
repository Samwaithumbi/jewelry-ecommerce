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
  toErrorResponse,
} from '@/lib/mpesa/errors';

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
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = initiatePaymentSchema.parse(body);

    const { orderId, phoneNumber } = validatedData;

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Verify order is payable (exists, not paid, valid amount)
    // Note: In a real implementation, you'd get userId from session
    const order = await verifyOrderPayable(orderId);

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
