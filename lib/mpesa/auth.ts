/**
 * Daraja OAuth Authentication
 * 
 * This module handles OAuth authentication with Safaricom Daraja API.
 * It obtains access tokens required for making STK Push requests.
 * 
 * SECURITY:
 * - Consumer key and secret are never exposed to the client
 * - Access tokens are cached to avoid unnecessary OAuth requests
 * - Tokens expire after 1 hour (Daraja default)
 * - Credentials are encoded using Base64
 */

import { getOAuthUrl, getMpesaConfig, isMock } from './config';
import { DarajaAuthError, MpesaNetworkError } from './errors';
import { DarajaOAuthResponse } from './types';
import { mockGetOAuthToken } from './mock-stk-push';

/**
 * In-memory cache for access token
 * In production, consider using Redis for distributed caching
 */
let tokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Generate Base64 encoded credentials for OAuth
 * 
 * Daraja uses Basic Authentication with Base64 encoded consumer key:secret
 * 
 * @returns Base64 encoded credentials
 */
function generateBase64Credentials(): string {
  const config = getMpesaConfig();
  const credentials = `${config.consumerKey}:${config.consumerSecret}`;
  return Buffer.from(credentials).toString('base64');
}

/**
 * Get access token from Daraja OAuth endpoint
 * 
 * This function:
 * 1. Checks if a valid cached token exists
 * 2. If not, requests a new token from Daraja
 * 3. Caches the token with expiration time
 * 
 * @returns Access token string
 * @throws DarajaAuthError if authentication fails
 * @throws MpesaNetworkError if network request fails
 */
export async function getAccessToken(): Promise<string> {
  const config = getMpesaConfig();

  // Use mock implementation in mock mode
  if (isMock()) {
    const mockToken = await mockGetOAuthToken();
    
    // Cache the mock token
    tokenCache = {
      token: mockToken.accessToken,
      expiresAt: Date.now() + mockToken.expiresIn * 1000,
    };
    
    return mockToken.accessToken;
  }

  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    // Token is still valid, return cached token
    return tokenCache.token;
  }

  try {
    const authUrl = getOAuthUrl();
    const credentials = generateBase64Credentials();

    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DarajaAuthError(
        `OAuth request failed with status ${response.status}: ${errorText}`
      );
    }

    const data: DarajaOAuthResponse = await response.json();

    if (!data.access_token) {
      throw new DarajaAuthError('Invalid OAuth response: missing access_token');
    }

    // Cache the token with expiration
    // Daraja tokens expire after 1 hour (3600 seconds)
    // We set expiration 5 minutes early to be safe
    const expiresIn = parseInt(data.expires_in, 10) || 3600;
    const expiresAt = Date.now() + (expiresIn - 300) * 1000; // 5 minutes buffer

    tokenCache = {
      token: data.access_token,
      expiresAt,
    };

    return data.access_token;
  } catch (error) {
    if (error instanceof DarajaAuthError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new MpesaNetworkError('Failed to connect to Daraja OAuth endpoint');
    }

    throw new DarajaAuthError(
      `Unexpected error during OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear cached access token
 * 
 * Use this if you need to force a new token request
 * (e.g., after configuration changes)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

/**
 * Check if access token is cached and valid
 * 
 * @returns true if valid token exists in cache
 */
export function hasValidToken(): boolean {
  return tokenCache !== null && tokenCache.expiresAt > Date.now();
}

/**
 * Get token cache information (for debugging/monitoring)
 * 
 * @returns Token cache status or null if no token cached
 */
export function getTokenCacheInfo() {
  if (!tokenCache) {
    return null;
  }

  return {
    hasToken: true,
    expiresAt: tokenCache.expiresAt,
    expiresIn: Math.max(0, tokenCache.expiresAt - Date.now()),
    isExpired: tokenCache.expiresAt <= Date.now(),
  };
}
