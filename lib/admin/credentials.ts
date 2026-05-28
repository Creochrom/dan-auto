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
import type { AdminRole } from "@/lib/types/admin-user";

const ITERATIONS = 100_000;
const KEY_LEN = 32;
const DIGEST = "sha256";
const EXPECTED_FORMAT = "pbkdf2:sha256:<iterations>:<salt_hex>:<hash_hex>";

function verifyPlainPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected?.trim()) {
    throw new Error(
      "[admin] Set ADMIN_PASSWORD (dev) or ADMIN_PASSWORD_HASH (production)"
    );
  }
  const a = crypto.createHash("sha256").update(password, "utf8").digest();
  const b = crypto.createHash("sha256").update(expected.trim(), "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

function verifyHashedPassword(password: string): boolean {
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

export function hashAdminPassword(password: string, iterations = ITERATIONS): string {
  const pwd = password.trim();
  if (pwd.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = crypto.randomBytes(32);
  const derived = crypto.pbkdf2Sync(pwd, salt, iterations, KEY_LEN, DIGEST);
  return `pbkdf2:sha256:${iterations}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPasswordAgainstHash(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }
  const [, , rawIterations, saltHex, storedHashHex] = parts;
  const iterations = Number(rawIterations);
  if (!Number.isInteger(iterations) || iterations < 10_000) return false;
  const salt = Buffer.from(saltHex, "hex");
  const storedHash = Buffer.from(storedHashHex, "hex");
  const derived = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST);
  if (derived.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(derived, storedHash);
}

/**
 * Verifies password: prefers ADMIN_PASSWORD_HASH, else ADMIN_PASSWORD (dev/local).
 */
export function verifyAdminPassword(password: string): boolean {
  if (process.env.ADMIN_PASSWORD_HASH?.trim()) {
    return verifyHashedPassword(password);
  }
  return verifyPlainPassword(password);
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

export function getFallbackAdminRole(): AdminRole {
  const envRole = process.env.ADMIN_ROLE?.trim().toLowerCase();
  if (envRole === "owner" || envRole === "admin" || envRole === "mechanic") {
    return envRole;
  }
  return "owner";
}
