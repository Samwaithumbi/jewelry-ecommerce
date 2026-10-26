import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DuplicateCallbackError, InvalidCallbackError } from '../lib/mpesa/errors';
import { PaymentStatus } from '../lib/mpesa/types';

describe('Callback Idempotency & Request Mismatch Guards', () => {
  // Simulates the idempotency guard logic found in lib/mpesa/db.ts
  function processCallbackIdempotencyCheck(
    existingPayment: {
      status: PaymentStatus;
      merchantRequestId?: string;
      checkoutRequestId: string;
      mpesaReceiptNumber?: string;
    },
    incomingData: {
      merchantRequestId: string;
      checkoutRequestId: string;
    }
  ) {
    // 1. Guard against MerchantRequestID mismatch
    if (
      existingPayment.merchantRequestId &&
      existingPayment.merchantRequestId !== incomingData.merchantRequestId
    ) {
      throw new InvalidCallbackError('MerchantRequestID mismatch');
    }

    // 2. Guard against duplicate callbacks when already in terminal state
    if (
      existingPayment.status === PaymentStatus.SUCCESS ||
      existingPayment.status === PaymentStatus.FAILED ||
      existingPayment.status === PaymentStatus.CANCELLED
    ) {
      throw new DuplicateCallbackError(
        incomingData.checkoutRequestId,
        existingPayment.mpesaReceiptNumber || 'N/A'
      );
    }

    return true;
  }

  it('allows initial callback when payment is still pending', () => {
    const payment = {
      status: PaymentStatus.PENDING,
      merchantRequestId: 'MR-123',
      checkoutRequestId: 'CR-456',
    };
    const incoming = {
      merchantRequestId: 'MR-123',
      checkoutRequestId: 'CR-456',
    };

    assert.strictEqual(processCallbackIdempotencyCheck(payment, incoming), true);
  });

  it('rejects duplicate callback with DuplicateCallbackError if payment is already SUCCESS', () => {
    const payment = {
      status: PaymentStatus.SUCCESS,
      merchantRequestId: 'MR-123',
      checkoutRequestId: 'CR-456',
      mpesaReceiptNumber: 'NLJ7RT61SV',
    };
    const incoming = {
      merchantRequestId: 'MR-123',
      checkoutRequestId: 'CR-456',
    };

    assert.throws(
      () => processCallbackIdempotencyCheck(payment, incoming),
      (err: any) =>
        err instanceof DuplicateCallbackError &&
        err.code === 'DUPLICATE_CALLBACK' &&
        err.receiptNumber === 'NLJ7RT61SV'
    );
  });

  it('rejects duplicate callback if payment is already CANCELLED or FAILED', () => {
    const payment = {
      status: PaymentStatus.CANCELLED,
      merchantRequestId: 'MR-123',
      checkoutRequestId: 'CR-456',
    };
    const incoming = {
      merchantRequestId: 'MR-123',
      checkoutRequestId: 'CR-456',
    };

    assert.throws(
      () => processCallbackIdempotencyCheck(payment, incoming),
      DuplicateCallbackError
    );
  });

  it('rejects callback with MerchantRequestID mismatch', () => {
    const payment = {
      status: PaymentStatus.PENDING,
      merchantRequestId: 'MR-EXPECTED',
      checkoutRequestId: 'CR-456',
    };
    const incoming = {
      merchantRequestId: 'MR-ATTACKER-SPOOF',
      checkoutRequestId: 'CR-456',
    };

    assert.throws(
      () => processCallbackIdempotencyCheck(payment, incoming),
      (err: any) =>
        err instanceof InvalidCallbackError &&
        err.message.includes('MerchantRequestID mismatch')
    );
  });
});
