/**
 * Admin credential verification — Node.js only.
 * Uses PBKDF2-SHA256 via the built-in `crypto` module.
 * Do NOT import from middleware.ts (Edge runtime).
 *
 * Stored hash format in ADMIN_PASSWORD_HASH env var:
 *   pbkdf2:sha256:<iterations>:<salt_hex>:<hash_hex>
 *
 * Generate a hash (run once, paste output into Vercel + .env.local):
 *   node -e "
 *     const c = require('crypto');
 *     const salt = c.randomBytes(32).toString('hex');
 *     const hash = c.pbkdf2Sync('YourPassword', Buffer.from(salt,'hex'), 100000, 32, 'sha256').toString('hex');
 *     console.log('pbkdf2:sha256:100000:' + salt + ':' + hash);
 *   "
 */

import crypto from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 32;
const DIGEST = "sha256";
const EXPECTED_FORMAT = "pbkdf2:sha256:<iterations>:<salt_hex>:<hash_hex>";

/**
 * Verifies a plaintext password against the stored PBKDF2 hash string.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 * Throws if ADMIN_PASSWORD_HASH is missing or malformed.
 */
export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!stored) {
    throw new Error(
      `[admin] ADMIN_PASSWORD_HASH is not set. Format: ${EXPECTED_FORMAT}`
    );
  }

  const parts = stored.split(":");
  // Format: pbkdf2:sha256:<iterations>:<salt_hex>:<hash_hex>
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    throw new Error(
      `[admin] ADMIN_PASSWORD_HASH format invalid. Expected: ${EXPECTED_FORMAT}`
    );
  }

  const [, , rawIterations, saltHex, storedHashHex] = parts;
  const iterations = Number(rawIterations);
  if (!Number.isInteger(iterations) || iterations < 10_000) {
    throw new Error("[admin] ADMIN_PASSWORD_HASH: iterations must be a number >= 10000");
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedHash = Buffer.from(storedHashHex, "hex");

  const derived = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST);
  return crypto.timingSafeEqual(derived, storedHash);
}

/**
 * Returns the admin username from env.
 * Throws if ADMIN_USERNAME is not set.
 */
export function getAdminUsername(): string {
  const username = process.env.ADMIN_USERNAME?.trim();
  if (!username) throw new Error("[admin] ADMIN_USERNAME is not set");
  return username;
}
