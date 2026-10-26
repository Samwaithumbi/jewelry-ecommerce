import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AmountMismatchError } from '../lib/mpesa/errors';

describe('M-Pesa Amount Calculations & Validation', () => {
  function validateAmountMatch(expectedCents: number, reportedKsh: number) {
    const expectedKsh = expectedCents / 100;
    if (Math.abs(reportedKsh - expectedKsh) > 0.01) {
      throw new AmountMismatchError(expectedCents, Math.round(reportedKsh * 100));
    }
    return true;
  }

  it('accepts exact matching amounts between minor units (cents) and major units (KSh)', () => {
    // 150,000 cents = 1,500 KSh
    assert.strictEqual(validateAmountMatch(150000, 1500), true);
    // 50,000 cents = 500 KSh (gift wrap price)
    assert.strictEqual(validateAmountMatch(50000, 500), true);
    // 100 cents = 1 KSh (minimum Daraja transaction)
    assert.strictEqual(validateAmountMatch(100, 1), true);
  });

  it('rejects tampered or mismatched amounts', () => {
    // Order was 5,000 KSh (500,000 cents), attacker paid 1 KSh
    assert.throws(
      () => validateAmountMatch(500000, 1),
      (err: any) => err instanceof AmountMismatchError && err.code === 'AMOUNT_MISMATCH'
    );

    // Difference of 1 KSh
    assert.throws(
      () => validateAmountMatch(100000, 999),
      AmountMismatchError
    );
  });

  it('tolerates sub-cent floating point precision discrepancies within 0.01 KSh', () => {
    // 1500.004 KSh vs 1500 KSh
    assert.strictEqual(validateAmountMatch(150000, 1500.004), true);
  });
});
