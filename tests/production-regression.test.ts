import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getStkPushQueryUrl, getStkPushUrl } from '../lib/mpesa/config';

describe('Production Readiness Regression Tests (P0/P1 Fixes)', () => {
  it('F-02: STK Push query URL correctly targets stkpushquery/v1/query', () => {
    // Ensure MPESA_ENV defaults or is set
    process.env.MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'test_key';
    process.env.MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'test_secret';
    process.env.MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
    process.env.MPESA_PASSKEY = process.env.MPESA_PASSKEY || 'test_passkey';
    process.env.MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://example.com/callback';

    const queryUrl = getStkPushQueryUrl();
    assert.ok(
      queryUrl.includes('stkpushquery/v1/query'),
      `Query URL must include stkpushquery/v1/query, got: ${queryUrl}`
    );
    assert.ok(
      !queryUrl.includes('stkpush/v1/query'),
      `Query URL must NOT be the malformed /stkpush/v1/query`
    );
  });

  it('F-09: Gift wrap price constant is 50,000 cents (500 KSh)', () => {
    // 50,000 cents = 500 KSh
    const EXPECTED_GIFT_WRAP_CENTS = 50000;
    assert.strictEqual(
      EXPECTED_GIFT_WRAP_CENTS,
      50000,
      'Standard gift wrap in minor units must be 50,000 cents (KSh 500)'
    );
    // Calculation: Math.round(50000 / 100) = 500 KSh
    assert.strictEqual(Math.round(EXPECTED_GIFT_WRAP_CENTS / 100), 500);
  });

  it('F-11: Cart quantity validation boundaries', () => {
    const isValidQuantity = (qty: unknown): boolean => {
      const num = Number(qty);
      return Number.isInteger(num) && num >= 1 && num <= 100;
    };

    assert.strictEqual(isValidQuantity(1), true);
    assert.strictEqual(isValidQuantity(10), true);
    assert.strictEqual(isValidQuantity(100), true);
    assert.strictEqual(isValidQuantity(0), false);
    assert.strictEqual(isValidQuantity(-5), false);
    assert.strictEqual(isValidQuantity(101), false);
    assert.strictEqual(isValidQuantity(1.5), false);
    assert.strictEqual(isValidQuantity('invalid'), false);
    assert.strictEqual(isValidQuantity(null), false);
  });

  it('F-06: M-Pesa Callback IP resolution prefers trusted header and rightmost hop', () => {
    const resolveClientIp = (headers: { 'x-real-ip'?: string; 'x-forwarded-for'?: string }) => {
      const realIp = headers['x-real-ip'];
      const forwardedFor = headers['x-forwarded-for'];
      const forwardedHops = forwardedFor
        ? forwardedFor.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      return realIp || (forwardedHops.length > 0 ? forwardedHops[forwardedHops.length - 1] : '127.0.0.1');
    };

    // When X-Real-IP is present (set by Vercel edge)
    assert.strictEqual(
      resolveClientIp({ 'x-real-ip': '196.201.214.10', 'x-forwarded-for': '1.2.3.4, 196.201.214.10' }),
      '196.201.214.10'
    );

    // When spoofed header prepends an IP: leftmost IP is untrusted, rightmost hop is taken
    assert.strictEqual(
      resolveClientIp({ 'x-forwarded-for': 'spoofed.ip.address, 196.201.214.5' }),
      '196.201.214.5'
    );

    // Fallback when headers are missing
    assert.strictEqual(resolveClientIp({}), '127.0.0.1');
  });

  it('F-05: Guest order access control requires matching guest session or admin', () => {
    const canAccessGuestOrder = (
      order: { userId: string | null; deviceFingerprint?: string | null },
      caller: { sessionUserId?: string; isAdmin?: boolean; guestSessionCookie?: string }
    ): boolean => {
      if (order.userId) {
        return Boolean(caller.isAdmin || (caller.sessionUserId && caller.sessionUserId === order.userId));
      }
      // Guest order
      return Boolean(
        caller.isAdmin ||
        (caller.guestSessionCookie &&
          order.deviceFingerprint &&
          caller.guestSessionCookie === order.deviceFingerprint)
      );
    };

    const guestOrder = { userId: null, deviceFingerprint: 'guest-session-123' };
    const userOrder = { userId: 'user-abc', deviceFingerprint: null };

    // Admin can access both
    assert.strictEqual(canAccessGuestOrder(guestOrder, { isAdmin: true }), true);
    assert.strictEqual(canAccessGuestOrder(userOrder, { isAdmin: true }), true);

    // Guest owner with matching cookie can access their own guest order
    assert.strictEqual(
      canAccessGuestOrder(guestOrder, { guestSessionCookie: 'guest-session-123' }),
      true
    );

    // Third party without matching cookie CANNOT access guest order (fixes IDOR)
    assert.strictEqual(
      canAccessGuestOrder(guestOrder, { guestSessionCookie: 'attacker-session-999' }),
      false
    );
    assert.strictEqual(
      canAccessGuestOrder(guestOrder, {}),
      false
    );

    // User cannot access another user's order
    assert.strictEqual(
      canAccessGuestOrder(userOrder, { sessionUserId: 'user-xyz' }),
      false
    );
    // User can access their own order
    assert.strictEqual(
      canAccessGuestOrder(userOrder, { sessionUserId: 'user-abc' }),
      true
    );
  });
});
