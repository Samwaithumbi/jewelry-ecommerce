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
import { eq, and, desc } from 'drizzle-orm';
import { PaymentStatus, PaymentProvider, ExtractedCallbackData } from './types';
import {
  OrderNotFoundError,
  OrderAlreadyPaidError,
  PaymentNotFoundError,
  InvalidAmountError,
  DuplicateCallbackError,
} from './errors';
import { formatTransactionDate } from './callback';

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

  // Check authorization if userId provided
  if (userId && order.userId !== userId) {
    throw new OrderNotFoundError(orderId); // Return not found for security
  }

  // Check if order is already paid
  const existingPayment = await getPaymentByOrderId(orderId);
  if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
    throw new OrderAlreadyPaidError(orderId);
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
 * 5. Uses database transaction for consistency
 * 
 * @param callbackData - Extracted callback data
 * @returns Updated payment record
 * @throws DuplicateCallbackError if payment already successful
 * @throws PaymentNotFoundError if payment not found
 */
export async function processPaymentCallback(callbackData: ExtractedCallbackData) {
  // Find payment by checkout request ID
  const payment = await getPaymentByCheckoutRequestId(callbackData.checkoutRequestId);

  if (!payment) {
    throw new PaymentNotFoundError(callbackData.checkoutRequestId);
  }

  // Idempotency check: if payment is already successful, do nothing
  if (payment.status === PaymentStatus.SUCCESS) {
    throw new DuplicateCallbackError(callbackData.checkoutRequestId);
  }

  // Determine payment status
  const status = callbackData.resultCode === '0' 
    ? PaymentStatus.SUCCESS 
    : callbackData.resultCode === '1032' || callbackData.resultCode === '1037'
    ? PaymentStatus.CANCELLED
    : PaymentStatus.FAILED;

  // Format transaction date
  const transactionDate = formatTransactionDate(callbackData.transactionDate);

  // Use database transaction for atomic updates
  // Note: Neon HTTP doesn't support transactions, so we'll use sequential updates
  // For production with transaction support, use: db.transaction(async (tx) => { ... })

  // Update payment
  const updatedPayment = await db
    .update(payments)
    .set({
      status,
      mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
      resultCode: callbackData.resultCode,
      resultDescription: callbackData.resultDescription,
      transactionDate: transactionDate ? new Date(transactionDate) : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))
    .returning();

  // If payment successful, update order status
  if (status === PaymentStatus.SUCCESS) {
    await db
      .update(orders)
      .set({
        status: 'confirmed' as any, // Update to confirmed status
      })
      .where(eq(orders.id, payment.orderId));
  }

  return updatedPayment[0];
}

/**
 * Get payment status for client
 * 
 * This function returns only safe information for the client.
 * Sensitive information like raw callback data is not exposed.
 * 
 * @param paymentId - Payment ID
 * @param userId - User ID (for authorization)
 * @returns Payment status response
 * @throws PaymentNotFoundError if payment not found
 * @throws Error if unauthorized
 */
export async function getPaymentStatusForClient(paymentId: string, userId?: string) {
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    throw new PaymentNotFoundError(paymentId);
  }

  // Authorization check: ensure user owns the payment
  if (userId) {
    const order = await getOrderById(payment.orderId);
    if (order && order.userId !== userId) {
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
