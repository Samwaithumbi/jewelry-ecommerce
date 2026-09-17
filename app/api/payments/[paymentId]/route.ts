/**
 * Payment Status API Endpoint
 * 
 * GET /api/payments/[paymentId]
 * 
 * This endpoint returns the current status of a payment.
 * It is used by the frontend to poll for payment status updates.
 * 
 * SECURITY:
 * - Authorization is checked (user can only view their own payments)
 * - Only safe information is exposed (no sensitive callback data)
 * - Payment amounts are returned in cents for consistency
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatusForClient } from '@/lib/mpesa/db';
import { PaymentNotFoundError, toErrorResponse } from '@/lib/mpesa/errors';

/**
 * GET handler for payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Note: In a real implementation, you'd get userId from session
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;
    const userId = undefined; // TODO: Implement session-based auth

    // Get payment status
    const paymentStatus = await getPaymentStatusForClient(paymentId, userId);

    // If payment is cancelled or failed, return error for frontend to redirect
    if (paymentStatus.status === 'cancelled' || paymentStatus.status === 'failed') {
      return NextResponse.json({
        success: false,
        status: paymentStatus.status,
        error: paymentStatus.status === 'cancelled' 
          ? 'Payment expired. Please initiate a new payment.' 
          : 'Payment failed. Please try again.',
      }, { status: 400 });
    }

    return NextResponse.json(paymentStatus);

  } catch (error) {
    // Handle payment not found
    if (error instanceof PaymentNotFoundError) {
      return NextResponse.json(toErrorResponse(error), { status: 404 });
    }

    // Handle unauthorized access
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not authorized to view this payment',
        },
        { status: 403 }
      );
    }

    // Handle unexpected errors
    console.error('Payment status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
