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

import { getOAuthUrl, getMpesaConfig } from './config';
import { DarajaAuthError, MpesaNetworkError } from './errors';
import { DarajaOAuthResponse } from './types';
import { redis } from '@/lib/redis';

const REDIS_TOKEN_KEY = 'mpesa:access_token';

/**
 * In-memory cache for access token (fallback / process-local)
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
 * 1. Checks process-local cache
 * 2. Checks distributed Upstash Redis cache (F-16)
 * 3. If cache miss, requests a new token from Daraja
 * 4. Caches the token with TTL
 * 
 * @returns Access token string
 * @throws DarajaAuthError if authentication fails
 * @throws MpesaNetworkError if network request fails
 */
export async function getAccessToken(): Promise<string> {
  // 1. Check local memory cache
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // 2. Check distributed Redis cache (F-16)
  try {
    const cachedToken = await redis.get<string>(REDIS_TOKEN_KEY);
    if (cachedToken) {
      // Sync to process-local cache for 5 minutes
      tokenCache = {
        token: cachedToken,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
      return cachedToken;
    }
  } catch (redisErr) {
    console.warn('[Daraja Auth] Redis token cache check failed, proceeding to fetch:', redisErr);
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
    const ttlSeconds = Math.max(60, expiresIn - 300); // 5 minutes buffer
    const expiresAt = Date.now() + ttlSeconds * 1000;

    tokenCache = {
      token: data.access_token,
      expiresAt,
    };

    // Store in distributed Redis cache (F-16)
    try {
      await redis.set(REDIS_TOKEN_KEY, data.access_token, { ex: ttlSeconds });
    } catch (redisSaveErr) {
      console.warn('[Daraja Auth] Failed to save token to Redis:', redisSaveErr);
    }

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
  redis.del(REDIS_TOKEN_KEY).catch(err => {
    console.warn('Failed to delete token from Redis:', err);
  });
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
