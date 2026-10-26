import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractCallbackData,
  determinePaymentStatus,
  isValidCallback,
  formatTransactionDate,
} from '../lib/mpesa/callback';
import { PaymentStatus } from '../lib/mpesa/types';
import { InvalidCallbackError } from '../lib/mpesa/errors';

describe('M-Pesa Callback Processing', () => {
  it('extractCallbackData parses a valid successful Daraja callback payload', () => {
    const rawCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: '29115-34620561-1',
          CheckoutRequestID: 'ws_CO_1912202310203012345678',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1500.0 },
              { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
              { Name: 'TransactionDate', Value: 20231219102030 },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    };

    const data = extractCallbackData(rawCallback as any);
    assert.strictEqual(data.merchantRequestId, '29115-34620561-1');
    assert.strictEqual(data.checkoutRequestId, 'ws_CO_1912202310203012345678');
    assert.strictEqual(data.resultCode, '0');
    assert.strictEqual(data.mpesaReceiptNumber, 'NLJ7RT61SV');
    assert.strictEqual(data.amount, 1500);
    assert.strictEqual(data.phoneNumber, '254712345678');
    assert.strictEqual(data.transactionDate, '20231219102030');
  });

  it('extractCallbackData parses a failed or cancelled callback without metadata', () => {
    const failedCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: '29115-34620561-1',
          CheckoutRequestID: 'ws_CO_1912202310203012345678',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user.',
        },
      },
    };

    const data = extractCallbackData(failedCallback as any);
    assert.strictEqual(data.resultCode, '1032');
    assert.strictEqual(data.mpesaReceiptNumber, undefined);
    assert.strictEqual(data.amount, undefined);
  });

  it('extractCallbackData throws InvalidCallbackError on missing required fields', () => {
    assert.throws(
      () => extractCallbackData({} as any),
      InvalidCallbackError
    );
    assert.throws(
      () => extractCallbackData({ Body: {} } as any),
      InvalidCallbackError
    );
    assert.throws(
      () =>
        extractCallbackData({
          Body: {
            stkCallback: {
              CheckoutRequestID: 'xyz',
              ResultCode: 0,
            },
          },
        } as any),
      InvalidCallbackError
    );
  });

  it('determinePaymentStatus correctly maps Daraja result codes', () => {
    assert.strictEqual(determinePaymentStatus(0), PaymentStatus.SUCCESS);
    assert.strictEqual(determinePaymentStatus('0'), PaymentStatus.SUCCESS);
    assert.strictEqual(determinePaymentStatus(1032), PaymentStatus.CANCELLED);
    assert.strictEqual(determinePaymentStatus('1032'), PaymentStatus.CANCELLED);
    assert.strictEqual(determinePaymentStatus(1037), PaymentStatus.CANCELLED);
    assert.strictEqual(determinePaymentStatus(2001), PaymentStatus.FAILED);
    assert.strictEqual(determinePaymentStatus('9999'), PaymentStatus.FAILED);
  });

  it('isValidCallback performs structural validation', () => {
    assert.strictEqual(isValidCallback(null), false);
    assert.strictEqual(isValidCallback({}), false);
    assert.strictEqual(
      isValidCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: '123',
            CheckoutRequestID: '456',
            ResultCode: 0,
          },
        },
      }),
      true
    );
  });

  it('formatTransactionDate converts Daraja integer/string timestamp to ISO 8601', () => {
    assert.strictEqual(formatTransactionDate(20231219102030), '2023-12-19T10:20:30.000Z');
    assert.strictEqual(formatTransactionDate('20231219102030'), '2023-12-19T10:20:30.000Z');
    assert.strictEqual(formatTransactionDate(undefined), null);
    assert.strictEqual(formatTransactionDate('short'), null);
  });
});
