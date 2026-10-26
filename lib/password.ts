import crypto from "crypto";

/**
 * Hashes a plaintext password using Node.js scrypt with a unique random 16-byte salt.
 * Output format: `<salt_hex>:<derived_key_hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored `<salt_hex>:<derived_key_hex>` string
 * using crypto.timingSafeEqual to prevent timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const keyBuffer = Buffer.from(key, "hex");
        if (keyBuffer.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}
