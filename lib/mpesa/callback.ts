/**
 * M-PESA Callback Processing
 * 
 * This module handles callbacks from Safaricom Daraja API.
 * Callbacks are the primary method for determining payment success/failure.
 * 
 * CRITICAL: Callbacks must be idempotent. Daraja may send duplicate callbacks.
 * 
 * SECURITY:
 * - Never trust callback data without validation
 * - Use database transactions to prevent race conditions
 * - Log all callback processing for audit trail
 * - Never expose sensitive callback data to clients
 */

import { DarajaCallback, ExtractedCallbackData, PaymentStatus } from './types';
import { InvalidCallbackError, DuplicateCallbackError } from './errors';

/**
 * Extract relevant data from Daraja callback
 * 
 * This function parses the callback payload and extracts the
 * information needed to update the payment record.
 * 
 * @param callback - Raw callback from Daraja
 * @returns Extracted callback data
 * @throws InvalidCallbackError if callback structure is invalid
 */
export function extractCallbackData(callback: DarajaCallback): ExtractedCallbackData {
  try {
    const stkCallback = callback.Body?.stkCallback;

    if (!stkCallback) {
      throw new InvalidCallbackError('Missing stkCallback in callback body');
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    if (MerchantRequestID === undefined || MerchantRequestID === null) {
      throw new InvalidCallbackError('Missing MerchantRequestID');
    }

    if (CheckoutRequestID === undefined || CheckoutRequestID === null) {
      throw new InvalidCallbackError('Missing CheckoutRequestID');
    }

    if (ResultCode === undefined || ResultCode === null) {
      throw new InvalidCallbackError('Missing ResultCode');
    }

    // Extract metadata items
    const metadata = CallbackMetadata?.Item || [];
    const metadataMap = new Map<string, string>();

    metadata.forEach((item) => {
      // Only add items that have both Name and Value
      // Some items like Balance may not have a Value
      if (item.Name && item.Value !== undefined && item.Value !== null) {
        metadataMap.set(item.Name, String(item.Value));
      }
    });

    // Extract specific fields from metadata
    const mpesaReceiptNumber = metadataMap.get('MpesaReceiptNumber');
    const transactionDate = metadataMap.get('TransactionDate');
    const amount = metadataMap.get('Amount');
    const phoneNumber = metadataMap.get('PhoneNumber');

    // Balance field is optional and may be empty
    // Daraja sends ResultCode as a number (0) not a string ("0")

    return {
      merchantRequestId: String(MerchantRequestID),
      checkoutRequestId: String(CheckoutRequestID),
      resultCode: String(ResultCode),
      resultDescription: ResultDesc || '',
      mpesaReceiptNumber,
      transactionDate,
      amount: amount ? parseFloat(amount) : undefined,
      phoneNumber,
    };
  } catch (error) {
    if (error instanceof InvalidCallbackError) {
      throw error;
    }
    throw new InvalidCallbackError(
      `Failed to extract callback data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Determine payment status from result code
 * 
 * Daraja result codes:
 * - 0: Success
 * - 1032: Request cancelled by user
 * - 1037: Timeout (user didn't enter PIN)
 * - 2001: Invalid initiator/shortcode
 * - Other: Various failure reasons
 * 
 * @param resultCode - Result code from callback
 * @returns Payment status
 */
export function determinePaymentStatus(resultCode: string | number): PaymentStatus {
  switch (String(resultCode)) {
    case '0':
      return PaymentStatus.SUCCESS;
    case '1032':
      return PaymentStatus.CANCELLED;
    case '1037':
      return PaymentStatus.CANCELLED;
    default:
      return PaymentStatus.FAILED;
  }
}

/**
 * Validate callback structure
 * 
 * This function performs basic validation of the callback structure
 * before attempting to process it.
 * 
 * @param callback - Raw callback from Daraja
 * @returns true if valid, false otherwise
 */
export function isValidCallback(callback: any): callback is DarajaCallback {
  if (!callback || typeof callback !== 'object') {
    return false;
  }

  if (!callback.Body || typeof callback.Body !== 'object') {
    return false;
  }

  if (!callback.Body.stkCallback || typeof callback.Body.stkCallback !== 'object') {
    return false;
  }

  const stkCallback = callback.Body.stkCallback;

  if (
    stkCallback.MerchantRequestID === undefined ||
    stkCallback.MerchantRequestID === null ||
    stkCallback.CheckoutRequestID === undefined ||
    stkCallback.CheckoutRequestID === null ||
    stkCallback.ResultCode === undefined ||
    stkCallback.ResultCode === null
  ) {
    return false;
  }

  return true;
}

/**
 * Format transaction date from Daraja format
 *
 * Daraja sends dates in format: YYYYMMDDHHmmss (as string or number)
 * We need to convert to ISO 8601 format for database
 *
 * @param darajaDate - Date string or number from Daraja
 * @returns ISO 8601 date string or null if invalid
 */
export function formatTransactionDate(darajaDate: string | number | undefined): string | null {
  if (!darajaDate) {
    return null;
  }

  // Convert to string if it's a number
  const dateStr = typeof darajaDate === 'number' ? darajaDate.toString() : darajaDate;

  if (dateStr.length !== 14) {
    return null;
  }

  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hours = dateStr.substring(8, 10);
    const minutes = dateStr.substring(10, 12);
    const seconds = dateStr.substring(12, 14);

    const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Check if callback indicates success
 * 
 * @param callback - Daraja callback
 * @returns true if payment was successful
 */
export function isSuccessfulCallback(callback: DarajaCallback): boolean {
  const data = extractCallbackData(callback);
  return data.resultCode === '0';
}

/**
 * Check if callback indicates cancellation
 * 
 * @param callback - Daraja callback
 * @returns true if payment was cancelled
 */
export function isCancelledCallback(callback: DarajaCallback): boolean {
  const data = extractCallbackData(callback);
  return data.resultCode === '1032' || data.resultCode === '1037';
}

/**
 * Get user-friendly error message from result description
 * 
 * @param resultDescription - Result description from callback
 * @returns User-friendly error message
 */
export function getUserErrorMessage(resultDescription: string): string {
  const description = resultDescription.toLowerCase();

  if (description.includes('insufficient')) {
    return 'Insufficient funds in your M-PESA account';
  }

  if (description.includes('timeout')) {
    return 'Payment timed out. Please try again';
  }

  if (description.includes('cancel')) {
    return 'Payment was cancelled';
  }

  if (description.includes('invalid')) {
    return 'Invalid payment details. Please check and try again';
  }

  return 'Payment failed. Please try again or contact support';
}
