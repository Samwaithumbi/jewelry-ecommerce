'use server';

/**
 * Server Action: Check Payment Status
 * 
 * This server action provides a secure way to check payment status.
 * It runs on the server and enforces authorization.
 */

import { z } from 'zod';
import { getPaymentStatusForClient } from '@/lib/mpesa/db';
import { PaymentNotFoundError } from '@/lib/mpesa/errors';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Input validation schema
 */
const checkPaymentStatusSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
});

/**
 * Check payment status
 */
export async function checkPaymentStatus(paymentId: string) {
  try {
    const validatedData = checkPaymentStatusSchema.parse({ paymentId });

    // Retrieve authenticated user from session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const paymentStatus = await getPaymentStatusForClient(
      validatedData.paymentId,
      userId
    );

    return paymentStatus;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Invalid payment ID',
      };
    }

    if (error instanceof PaymentNotFoundError) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return {
        success: false,
        error: 'You are not authorized to view this payment',
      };
    }

    console.error('Payment status check error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
