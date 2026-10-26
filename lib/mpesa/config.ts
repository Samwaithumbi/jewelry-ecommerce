/**
 * M-PESA Daraja Configuration
 * 
 * This module handles environment configuration for Safaricom Daraja API.
 * It separates sandbox and production environments and validates required credentials.
 * 
 * SECURITY: All credentials are loaded from environment variables only.
 * Never expose these values to the client side.
 */

export type MpesaEnvironment = 'sandbox' | 'production';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: MpesaEnvironment;
  apiUrl: string;
}

/**
 * Get M-PESA configuration from environment variables
 * 
 * Required environment variables:
 * - MPESA_CONSUMER_KEY: Daraja consumer key
 * - MPESA_CONSUMER_SECRET: Daraja consumer secret  
 * - MPESA_SHORTCODE: Paybill/Till number
 * - MPESA_PASSKEY: Lipa na M-PESA passkey
 * - MPESA_CALLBACK_URL: URL for Daraja callbacks
 * - MPESA_ENV: 'sandbox' or 'production'
 * 
 * @throws Error if required environment variables are missing
 */
export function getMpesaConfig(): MpesaConfig {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  const environment = (process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || 'sandbox') as MpesaEnvironment;

  // Validate required environment variables
  if (!consumerKey) {
    throw new Error('MPESA_CONSUMER_KEY environment variable is required');
  }
  if (!consumerSecret) {
    throw new Error('MPESA_CONSUMER_SECRET environment variable is required');
  }
  if (!shortcode) {
    throw new Error('MPESA_SHORTCODE environment variable is required');
  }
  if (!passkey) {
    throw new Error('MPESA_PASSKEY environment variable is required');
  }
  if (!callbackUrl) {
    throw new Error('MPESA_CALLBACK_URL environment variable is required');
  }

  // Validate environment
  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error(`MPESA_ENV must be 'sandbox' or 'production', got: ${environment}`);
  }

  // Set API URL based on environment
  const apiUrl = environment === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/mpesa/'
    : 'https://api.safaricom.co.ke/mpesa/';

  return {
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
    environment,
    apiUrl,
  };
}

/**
 * Check if running in sandbox environment
 */
export function isSandbox(): boolean {
  return getMpesaConfig().environment === 'sandbox';
}

/**
 * Get OAuth base URL for authentication
 */
export function getOAuthUrl(): string {
  const config = getMpesaConfig();
  // OAuth uses a different base URL than STK Push
  const oauthBaseUrl = config.environment === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  return oauthBaseUrl;
}

/**
 * Get STK Push URL
 */
export function getStkPushUrl(): string {
  const config = getMpesaConfig();
  return `${config.apiUrl}stkpush/v1/processrequest`;
}

/**
 * Get STK Push query URL for checking transaction status
 */
export function getStkPushQueryUrl(): string {
  const config = getMpesaConfig();
  return `${config.apiUrl}stkpushquery/v1/query`;
}
