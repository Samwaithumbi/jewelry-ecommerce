/**
 * M-PESA Daraja API Types
 * 
 * TypeScript types for Daraja API requests and responses.
 * These types ensure type safety throughout the payment flow.
 */

/**
 * OAuth response from Daraja authentication
 */
export interface DarajaOAuthResponse {
  access_token: string;
  expires_in: string;
}

/**
 * STK Push request payload
 */
export interface StkPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

/**
 * STK Push response from Daraja
 */
export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * STK Push query request
 */
export interface StkPushQueryRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  CheckoutRequestID: string;
}

/**
 * Callback metadata item
 */
export interface CallbackMetadataItem {
  Key: string;
  Value: string;
}

/**
 * Callback result body
 */
export interface CallbackResultBody {
  ResultCode: string;
  ResultDesc: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  CallbackMetadata: {
    CallbackMetadataItem: CallbackMetadataItem[];
  };
}

/**
 * Callback item structure
 */
export interface CallbackItem {
  Key: string;
  Value: string;
}

/**
 * Full callback payload from Daraja
 */
export interface DarajaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: string;
      ResultDesc: string;
      CallbackMetadata: {
        Item: CallbackItem[];
      };
    };
  };
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Payment provider enum
 */
export enum PaymentProvider {
  MPESA = 'mpesa',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

/**
 * Payment initiation request from client
 */
export interface InitiatePaymentRequest {
  orderId: string;
  phoneNumber: string;
}

/**
 * Payment initiation response
 */
export interface InitiatePaymentResponse {
  success: boolean;
  paymentId?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
  message?: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  success: boolean;
  status: PaymentStatus;
  amount?: number;
  mpesaReceiptNumber?: string;
  error?: string;
}

/**
 * Extracted callback data
 */
export interface ExtractedCallbackData {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: string;
  resultDescription: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  amount?: number;
  phoneNumber?: string;
}
