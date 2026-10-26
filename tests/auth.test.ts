import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword } from '../lib/password';

describe('Authentication Password Cryptography', () => {
  it('correctly hashes and verifies a plaintext password', async () => {
    const rawPassword = 'SecretLuminaPassword!2026';
    const hash = await hashPassword(rawPassword);

    assert.ok(hash.includes(':'), 'Hash format must be salt:key');
    const [salt, key] = hash.split(':');
    assert.strictEqual(salt.length, 32, 'Salt should be 16 bytes (32 hex characters)');
    assert.strictEqual(key.length, 128, 'Derived key should be 64 bytes (128 hex characters)');

    const isValid = await verifyPassword(rawPassword, hash);
    assert.strictEqual(isValid, true, 'Original password must verify true');
  });

  it('rejects an incorrect password', async () => {
    const rawPassword = 'CorrectPassword99';
    const wrongPassword = 'WrongPassword99';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(wrongPassword, hash);
    assert.strictEqual(isValid, false, 'Incorrect password must verify false');
  });

  it('generates unique salts for identical passwords', async () => {
    const password = 'SamePassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    assert.notStrictEqual(hash1, hash2, 'Hashes of identical passwords must have distinct random salts');
    assert.strictEqual(await verifyPassword(password, hash1), true);
    assert.strictEqual(await verifyPassword(password, hash2), true);
  });

  it('safely handles empty or malformed hashes without crashing', async () => {
    assert.strictEqual(await verifyPassword('password', ''), false);
    assert.strictEqual(await verifyPassword('password', 'malformedhashwithnosalt'), false);
    assert.strictEqual(await verifyPassword('password', 'salt:'), false);
  });
});
