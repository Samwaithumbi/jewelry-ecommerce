import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizePhoneNumber, isValidPhoneNumber, maskPhoneNumber } from '../lib/mpesa/phone';
import { InvalidPhoneNumberError } from '../lib/mpesa/errors';

describe('M-Pesa Phone Number Normalization', () => {
  it('normalizes local 07XXXXXXXX format to 2547XXXXXXXX', () => {
    assert.strictEqual(normalizePhoneNumber('0712345678'), '254712345678');
    assert.strictEqual(normalizePhoneNumber('0722000000'), '254722000000');
  });

  it('normalizes local 01XXXXXXXX format to 2541XXXXXXXX', () => {
    assert.strictEqual(normalizePhoneNumber('0112345678'), '254112345678');
  });

  it('normalizes +2547XXXXXXXX international format with leading plus', () => {
    assert.strictEqual(normalizePhoneNumber('+254712345678'), '254712345678');
    assert.strictEqual(normalizePhoneNumber('+254112345678'), '254112345678');
  });

  it('preserves existing 2547XXXXXXXX international format without plus', () => {
    assert.strictEqual(normalizePhoneNumber('254712345678'), '254712345678');
    assert.strictEqual(normalizePhoneNumber('254112345678'), '254112345678');
  });

  it('strips spaces, hyphens and formatting characters correctly', () => {
    assert.strictEqual(normalizePhoneNumber('0712 345 678'), '254712345678');
    assert.strictEqual(normalizePhoneNumber('+254-712-345-678'), '254712345678');
  });

  it('throws InvalidPhoneNumberError for invalid prefixes or non-Kenyan numbers', () => {
    assert.throws(() => normalizePhoneNumber('0812345678'), InvalidPhoneNumberError);
    assert.throws(() => normalizePhoneNumber('0612345678'), InvalidPhoneNumberError);
    assert.throws(() => normalizePhoneNumber('+12025550123'), InvalidPhoneNumberError);
  });

  it('throws InvalidPhoneNumberError for numbers with invalid length', () => {
    assert.throws(() => normalizePhoneNumber('0712345'), InvalidPhoneNumberError);
    assert.throws(() => normalizePhoneNumber('071234567890123456'), InvalidPhoneNumberError);
  });

  it('throws InvalidPhoneNumberError for empty or non-string input', () => {
    assert.throws(() => normalizePhoneNumber(''), InvalidPhoneNumberError);
    assert.throws(() => normalizePhoneNumber('abc'), InvalidPhoneNumberError);
  });

  it('isValidPhoneNumber accurately reports validity', () => {
    assert.strictEqual(isValidPhoneNumber('0712345678'), true);
    assert.strictEqual(isValidPhoneNumber('+254712345678'), true);
    assert.strictEqual(isValidPhoneNumber('0712345'), false);
    assert.strictEqual(isValidPhoneNumber('invalid'), false);
  });

  it('maskPhoneNumber correctly masks sensitive digits', () => {
    assert.strictEqual(maskPhoneNumber('254712345678'), '2547***45678');
    assert.strictEqual(maskPhoneNumber('short'), 'short');
  });
});
