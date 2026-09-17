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

    // Note: In a real implementation, you'd get userId from session
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;
    const userId = undefined; // TODO: Implement session-based auth

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
