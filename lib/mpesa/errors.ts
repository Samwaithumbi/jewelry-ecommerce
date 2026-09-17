/**
 * M-PESA Error Classes
 * 
 * Custom error classes for different M-PESA payment scenarios.
 * This enables precise error handling and user-friendly error messages.
 */

/**
 * Base M-PESA error class
 */
export class MpesaError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string = message
  ) {
    super(message);
    this.name = 'MpesaError';
  }
}

/**
 * Invalid phone number error
 */
export class InvalidPhoneNumberError extends MpesaError {
  constructor(phoneNumber: string) {
    super(
      `Invalid phone number: ${phoneNumber}`,
      'INVALID_PHONE_NUMBER',
      'Please enter a valid Kenyan phone number (e.g., 0712345678)'
    );
    this.name = 'InvalidPhoneNumberError';
  }
}

/**
 * Order not found error
 */
export class OrderNotFoundError extends MpesaError {
  constructor(orderId: string) {
    super(
      `Order not found: ${orderId}`,
      'ORDER_NOT_FOUND',
      'Order not found. Please check your order and try again.'
    );
    this.name = 'OrderNotFoundError';
  }
}

/**
 * Order already paid error
 */
export class OrderAlreadyPaidError extends MpesaError {
  constructor(orderId: string) {
    super(
      `Order already paid: ${orderId}`,
      'ORDER_ALREADY_PAID',
      'This order has already been paid. No payment is required.'
    );
    this.name = 'OrderAlreadyPaidError';
  }
}

/**
 * Invalid amount error
 */
export class InvalidAmountError extends MpesaError {
  constructor(amount: number) {
    super(
      `Invalid amount: ${amount}`,
      'INVALID_AMOUNT',
      'Invalid payment amount. Please contact support.'
    );
    this.name = 'InvalidAmountError';
  }
}

/**
 * Daraja authentication error
 */
export class DarajaAuthError extends MpesaError {
  constructor(message: string = 'Failed to authenticate with Daraja') {
    super(
      message,
      'DARAJA_AUTH_ERROR',
      'Payment service is temporarily unavailable. Please try again later.'
    );
    this.name = 'DarajaAuthError';
  }
}

/**
 * STK Push failed error
 */
export class StkPushFailedError extends MpesaError {
  constructor(responseCode: string, responseDescription: string) {
    super(
      `STK Push failed: ${responseCode} - ${responseDescription}`,
      'STK_PUSH_FAILED',
      'Failed to initiate M-PESA payment. Please try again.'
    );
    this.name = 'StkPushFailedError';
  }
}

/**
 * Payment not found error
 */
export class PaymentNotFoundError extends MpesaError {
  constructor(paymentId: string) {
    super(
      `Payment not found: ${paymentId}`,
      'PAYMENT_NOT_FOUND',
      'Payment record not found. Please contact support.'
    );
    this.name = 'PaymentNotFoundError';
  }
}

/**
 * Unauthorized payment access error
 */
export class UnauthorizedPaymentError extends MpesaError {
  constructor() {
    super(
      'Unauthorized payment access',
      'UNAUTHORIZED_PAYMENT',
      'You are not authorized to access this payment.'
    );
    this.name = 'UnauthorizedPaymentError';
  }
}

/**
 * Duplicate callback error (for logging, not exposed to users)
 */
export class DuplicateCallbackError extends MpesaError {
  constructor(checkoutRequestId: string) {
    super(
      `Duplicate callback for checkout request: ${checkoutRequestId}`,
      'DUPLICATE_CALLBACK',
      'Duplicate callback received'
    );
    this.name = 'DuplicateCallbackError';
  }
}

/**
 * Invalid callback error
 */
export class InvalidCallbackError extends MpesaError {
  constructor(message: string = 'Invalid callback structure') {
    super(
      message,
      'INVALID_CALLBACK',
      'Invalid payment callback received.'
    );
    this.name = 'InvalidCallbackError';
  }
}

/**
 * Network error
 */
export class MpesaNetworkError extends MpesaError {
  constructor(message: string = 'Network error occurred') {
    super(
      message,
      'NETWORK_ERROR',
      'Network error. Please check your connection and try again.'
    );
    this.name = 'MpesaNetworkError';
  }
}

/**
 * Configuration error
 */
export class MpesaConfigError extends MpesaError {
  constructor(message: string) {
    super(
      `M-PESA configuration error: ${message}`,
      'CONFIG_ERROR',
      'Payment service is not configured correctly. Please contact support.'
    );
    this.name = 'MpesaConfigError';
  }
}

/**
 * Generic M-PESA error for unexpected scenarios
 */
export class MpesaGenericError extends MpesaError {
  constructor(message: string = 'An unexpected error occurred') {
    super(
      message,
      'GENERIC_ERROR',
      'An unexpected error occurred. Please try again or contact support.'
    );
    this.name = 'MpesaGenericError';
  }
}

/**
 * Convert M-PESA error to user-friendly response
 */
export function toErrorResponse(error: MpesaError) {
  return {
    success: false,
    error: error.userMessage,
    code: error.code,
  };
}
