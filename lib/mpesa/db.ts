/**
 * M-PESA Database Operations
 * 
 * This module handles all database operations related to payments.
 * It provides functions to create, update, and query payment records.
 * 
 * SECURITY:
 * - All database operations use parameterized queries
 * - Payment amounts are always retrieved from database, never from client
 * - Transactions are used for critical operations
 * - Idempotency is enforced to prevent duplicate processing
 */

import { db } from '../db';
import { payments, orders } from '../../drizzle/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PaymentStatus, PaymentProvider, ExtractedCallbackData } from './types';
import {
  OrderNotFoundError,
  OrderAlreadyPaidError,
  PaymentNotFoundError,
  InvalidAmountError,
  DuplicateCallbackError,
  InvalidCallbackError,
  AmountMismatchError,
  PaymentPendingError,
} from './errors';
import { formatTransactionDate, determinePaymentStatus } from './callback';
import { 
  confirmReservation, 
  releaseReservation, 
  InvalidReservationStateError,
  ReservationNotFoundError 
} from '../inventory/service';

export interface DarajaQueryResponse {
  ResponseCode?: string;
  ResponseDescription?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: string | number;
  resultCode?: string | number;
  ResultDesc?: string;
  MpesaReceiptNumber?: string;
}

/**
 * Create a new payment record
 * 
 * @param orderId - Order ID
 * @param provider - Payment provider (e.g., 'mpesa')
 * @param amount - Amount in cents
 * @param phoneNumber - Customer phone number
 * @returns Created payment record
 */
export async function createPayment(
  orderId: string,
  provider: PaymentProvider,
  amount: number,
  phoneNumber: string
) {
  // Set payment expiry to 15 minutes from now
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const payment = await db.insert(payments).values({
    orderId,
    provider,
    amount,
    phoneNumber,
    status: PaymentStatus.PENDING,
    expiresAt,
  }).returning();

  return payment[0];
}

/**
 * Get payment by ID
 * 
 * @param paymentId - Payment ID
 * @returns Payment record or null if not found
 */
export async function getPaymentById(paymentId: string) {
  const payment = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return payment[0] || null;
}

/**
 * Get payment by checkout request ID
 * 
 * This is used to locate payments during callback processing.
 * 
 * @param checkoutRequestId - Checkout Request ID from Daraja
 * @returns Payment record or null if not found
 */
export async function getPaymentByCheckoutRequestId(checkoutRequestId: string) {
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.checkoutRequestId, checkoutRequestId))
    .limit(1);
  return payment[0] || null;
}

/**
 * Get payment by order ID
 * 
 * @param orderId - Order ID
 * @returns Payment record or null if not found
 */
export async function getPaymentByOrderId(orderId: string) {
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  return payment[0] || null;
}

/**
 * Get order by ID
 * 
 * @param orderId - Order ID
 * @returns Order record or null if not found
 */
export async function getOrderById(orderId: string) {
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return order[0] || null;
}

/**
 * Verify order is payable
 * 
 * This function checks:
 * - Order exists
 * - Order is not already paid
 * - Order amount is valid
 * 
 * @param orderId - Order ID
 * @param userId - User ID (for authorization)
 * @returns Order with total amount
 * @throws OrderNotFoundError if order doesn't exist
 * @throws OrderAlreadyPaidError if order is already paid
 * @throws InvalidAmountError if amount is invalid
 */
export async function verifyOrderPayable(orderId: string, userId?: string) {
  const order = await getOrderById(orderId);

  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  // Check authorization if order belongs to a registered user
  if (order.userId && order.userId !== userId) {
    throw new OrderNotFoundError(orderId); // Return not found for security
  }

  // Check if order is already paid or actively being paid (F-06)
  const existingPayment = await getPaymentByOrderId(orderId);
  if (existingPayment) {
    if (existingPayment.status === PaymentStatus.SUCCESS) {
      throw new OrderAlreadyPaidError(orderId);
    }
    // Block duplicate payments if an active PENDING payment was initiated recently
    if (existingPayment.status === PaymentStatus.PENDING) {
      const createdAtMs = existingPayment.createdAt ? new Date(existingPayment.createdAt).getTime() : 0;
      const ageMs = Date.now() - createdAtMs;
      if (ageMs < 120 * 1000) {
        throw new PaymentPendingError(orderId);
      }
    }
  }

  // Validate amount
  if (order.totalCents <= 0) {
    throw new InvalidAmountError(order.totalCents);
  }

  return order;
}

/**
 * Update payment with STK Push identifiers
 * 
 * @param paymentId - Payment ID
 * @param merchantRequestId - Merchant Request ID from Daraja
 * @param checkoutRequestId - Checkout Request ID from Daraja
 * @returns Updated payment record
 */
export async function updatePaymentWithStkPushIdentifiers(
  paymentId: string,
  merchantRequestId: string,
  checkoutRequestId: string
) {
  const payment = await db
    .update(payments)
    .set({
      merchantRequestId,
      checkoutRequestId,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  return payment[0];
}

/**
 * Process payment callback (idempotent)
 * 
 * This function:
 * 1. Finds payment by checkout request ID
 * 2. Checks if payment is already successful (idempotency)
 * 3. Updates payment status
 * 4. Updates order status if payment successful
 * 5. Confirms or releases inventory reservation based on payment outcome
 * 6. Uses database transaction for consistency
 * 
 * @param callbackData - Extracted callback data
 * @returns Updated payment record
 * @throws DuplicateCallbackError if payment already successful
 * @throws PaymentNotFoundError if payment not found
 */
export async function processPaymentCallback(callbackData: ExtractedCallbackData) {
  // 1. Find payment by checkout request ID
  const payment = await getPaymentByCheckoutRequestId(callbackData.checkoutRequestId);

  if (!payment) {
    throw new PaymentNotFoundError(callbackData.checkoutRequestId);
  }

  // Correlate callback identifiers
  if (payment.merchantRequestId && callbackData.merchantRequestId !== payment.merchantRequestId) {
    throw new InvalidCallbackError('MerchantRequestID does not match payment record');
  }

  // Idempotency check: if payment is already successful, do not re-process
  if (payment.status === PaymentStatus.SUCCESS) {
    throw new DuplicateCallbackError(callbackData.checkoutRequestId);
  }

  // Format transaction date if present
  const transactionDate = formatTransactionDate(callbackData.transactionDate);
  const rawStatus = determinePaymentStatus(callbackData.resultCode);

  let finalStatus: PaymentStatus = rawStatus;

  // 2. Trust the callback as the authoritative source of truth.
  // The STK callback is sent server-to-server by Safaricom — ResultCode: 0 is proof of payment.
  // Amount integrity is verified against the callback payload.
  if (rawStatus === PaymentStatus.SUCCESS) {
    // F-07: Amount MUST be present in a success callback — reject if missing.
    // Daraja always includes Amount for a successful STK Push; absence is a red flag.
    if (callbackData.amount === undefined || callbackData.amount === null) {
      console.error('[Callback Security] Success callback missing Amount in metadata — rejecting');
      throw new InvalidCallbackError('Success callback is missing Amount in metadata');
    }
    // STK push sends Math.ceil(totalCents / 100) KSh to Daraja.
    // The callback reports the actual KSh charged (a whole number).
    // Compare in whole-KSh space so rounding is consistent on both sides.
    const expectedKsh = Math.ceil(payment.amount / 100);
    const reportedKsh = Math.round(callbackData.amount); // Daraja always sends whole KSh
    if (reportedKsh !== expectedKsh) {
      console.error(
        `[Callback Validation] Amount mismatch! Expected Ksh ${expectedKsh}, callback reported Ksh ${reportedKsh}`
      );
      throw new AmountMismatchError(payment.amount, reportedKsh * 100);
    }
    finalStatus = PaymentStatus.SUCCESS;
    console.log(`[Callback] Payment confirmed SUCCESS — receipt: ${callbackData.mpesaReceiptNumber}`);

    // F-08: In production, independently cross-check with Daraja Query API
    const isProduction = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || '').toLowerCase() === 'production';
    if (isProduction && callbackData.checkoutRequestId) {
      try {
        const { queryStkPushStatus } = await import('./stk-push');
        const queryRes = await queryStkPushStatus(callbackData.checkoutRequestId);
        const queryResultCode = String(queryRes?.ResultCode ?? queryRes?.resultCode);
        if (queryResultCode !== '0') {
          console.error(
            `[Callback Cross-Check] Daraja query verification failed for ${callbackData.checkoutRequestId}: ResultCode=${queryResultCode}`
          );
          throw new InvalidCallbackError('STK Push query cross-check verification failed');
        }
        console.log(`[Callback Cross-Check] Verified successfully with Safaricom query API.`);
      } catch (crossCheckErr) {
        if (crossCheckErr instanceof InvalidCallbackError) {
          throw crossCheckErr;
        }
        console.warn('[Callback Cross-Check] STK query check encountered network error, continuing with verified callback payload:', crossCheckErr);
      }
    }
  }

  // 3. Execute ALL DB mutations atomically (F-02)
  // Email fire-and-forget stays OUTSIDE the transaction (network I/O must not block atomicity).
  await db.transaction(async (tx) => {
    // F-19: Validate order state-machine transition BEFORE writing anything
    if (finalStatus === PaymentStatus.SUCCESS) {
      const currentOrderRows = await tx
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.id, payment.orderId))
        .limit(1);

      if (currentOrderRows.length > 0) {
        const { isValidStatusTransition } = await import('../order-status');
        const currentStatus = currentOrderRows[0].status as import('../order-status').OrderStatus;
        if (!isValidStatusTransition(currentStatus, 'confirmed')) {
          console.warn(
            `[Callback] Invalid state transition ${currentStatus} → confirmed for order ${payment.orderId}. ` +
            `Updating payment status only.`
          );
          // Only update payment — do not touch order or inventory
          await tx
            .update(payments)
            .set({
              status: finalStatus,
              mpesaReceiptNumber: callbackData.mpesaReceiptNumber || null,
              resultCode: String(callbackData.resultCode),
              resultDescription: callbackData.resultDescription,
              transactionDate: transactionDate ? new Date(transactionDate) : null,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));
          return;
        }
      }
    }

    // 4. Update payment record
    await tx
      .update(payments)
      .set({
        status: finalStatus,
        mpesaReceiptNumber: callbackData.mpesaReceiptNumber || null,
        resultCode: String(callbackData.resultCode),
        resultDescription: callbackData.resultDescription,
        transactionDate: transactionDate ? new Date(transactionDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // 5. SUCCESS: confirm inventory reservation + mark order confirmed
    if (finalStatus === PaymentStatus.SUCCESS) {
      const { inventoryReservations } = await import('../../drizzle/src/db/inventory-schema');
      const reservation = await tx.query.inventoryReservations.findFirst({
        where: eq(inventoryReservations.orderId, payment.orderId),
      });

      if (reservation && reservation.status === 'active') {
        try {
          await confirmReservation(reservation.id);
        } catch (error) {
          if (error instanceof InvalidReservationStateError || error instanceof ReservationNotFoundError) {
            console.warn(`Could not confirm reservation ${reservation.id}:`, (error as Error).message);
          } else {
            throw error;
          }
        }
      }

      await tx
        .update(orders)
        .set({ status: 'confirmed' })
        .where(eq(orders.id, payment.orderId));
    }

    // 6. FAILED / CANCELLED: release inventory reservation + mark order cancelled
    if (finalStatus === PaymentStatus.FAILED || finalStatus === PaymentStatus.CANCELLED) {
      const { inventoryReservations } = await import('../../drizzle/src/db/inventory-schema');
      const reservation = await tx.query.inventoryReservations.findFirst({
        where: eq(inventoryReservations.orderId, payment.orderId),
      });

      if (reservation && reservation.status === 'active') {
        try {
          await releaseReservation(reservation.id);
        } catch (error) {
          if (error instanceof InvalidReservationStateError || error instanceof ReservationNotFoundError) {
            console.warn(`Could not release reservation ${reservation.id}:`, (error as Error).message);
          } else {
            throw error;
          }
        }
      }

      await tx
        .update(orders)
        .set({ status: 'cancelled' })
        .where(eq(orders.id, payment.orderId));
    }
  });

  // 7. Fire-and-forget emails OUTSIDE the transaction
  if (finalStatus === PaymentStatus.SUCCESS) {
    const { sendOrderConfirmationEmailAsync } = await import('@/lib/emails/email');
    sendOrderConfirmationEmailAsync(payment.orderId).catch(error => {
      console.error('Failed to send confirmation email:', error);
    });
  }

  if (finalStatus === PaymentStatus.FAILED || finalStatus === PaymentStatus.CANCELLED) {
    const { sendPaymentFailedEmailAsync } = await import('@/lib/emails/email');
    sendPaymentFailedEmailAsync(
      payment.orderId,
      callbackData.resultDescription || 'Payment was not completed'
    ).catch(error => {
      console.error('Failed to send payment failed email:', error);
    });
  }

  return payment;
}

/**
 * Get payment status for client
 * 
 * This function returns only safe information for the client.
 * Sensitive information like raw callback data is not exposed.
 * 
 * @param paymentId - Payment ID
 * @param userId - User ID (for authorization, optional)
 * @returns Payment status response
 * @throws PaymentNotFoundError if payment not found
 * @throws Error if userId provided but doesn't match order owner
 */
export async function getPaymentStatusForClient(paymentId: string, userId?: string) {
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    throw new PaymentNotFoundError(paymentId);
  }

  // F-11: Authorization check
  const order = await getOrderById(payment.orderId);
  if (order && order.userId) {
    // Order belongs to an authenticated user — strictly require caller to match order owner
    if (!userId || order.userId !== userId) {
      throw new Error('Unauthorized');
    }
  }

  // Check if payment has expired
  let status = payment.status;
  if (payment.status === PaymentStatus.PENDING && payment.expiresAt) {
    const now = new Date();
    if (now > payment.expiresAt) {
      // Payment has expired, update status to cancelled
      await db.update(payments)
        .set({ status: PaymentStatus.CANCELLED })
        .where(eq(payments.id, paymentId));
      status = PaymentStatus.CANCELLED;
    }
  }

  return {
    success: true,
    status,
    amount: payment.amount,
    mpesaReceiptNumber: payment.mpesaReceiptNumber,
  };
}

/**
 * Get all payments for an order
 * 
 * @param orderId - Order ID
 * @returns Array of payment records
 */
export async function getPaymentsByOrderId(orderId: string) {
  const paymentsList = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt));

  return paymentsList;
}

/**
 * Get recent payments (for admin dashboard)
 * 
 * @param limit - Maximum number of payments to return
 * @returns Array of recent payment records
 */
export async function getRecentPayments(limit: number = 50) {
  const paymentsList = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(limit);

  return paymentsList;
}
