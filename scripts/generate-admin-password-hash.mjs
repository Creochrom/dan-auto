/**
 * Usage: node scripts/generate-admin-password-hash.mjs "YourPassword"
 * Paste output into ADMIN_PASSWORD_HASH on Vercel.
 */
import crypto from "crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/generate-admin-password-hash.mjs <password>");
  process.exit(1);
}

const iterations = 100_000;
const salt = crypto.randomBytes(32).toString("hex");
const hash = crypto
  .pbkdf2Sync(password, Buffer.from(salt, "hex"), iterations, 32, "sha256")
  .toString("hex");

console.log(`pbkdf2:sha256:${iterations}:${salt}:${hash}`);
