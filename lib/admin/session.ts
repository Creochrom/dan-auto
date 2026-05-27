/**
 * Admin session token — sign and verify.
 *
 * Uses the Web Crypto API (crypto.subtle) exclusively so this module
 * is safe to import from both the Edge-runtime middleware and Node.js routes.
 * No Buffer, no Node.js-specific imports.
 *
 * Token format: base64url(payload JSON) + "." + base64url(HMAC-SHA256 signature)
 * Payload: { login: string; exp: number (Unix ms) }
 */

export const ADMIN_COOKIE_NAME = "dan_admin_session";

/** Session lifetime — 8 hours in seconds (for cookie maxAge). */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

// ---------------------------------------------------------------------------
// Base64url helpers — no Buffer dependency, works in Edge + Node.js.
// ---------------------------------------------------------------------------

function b64uEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64uDecode(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(pad));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// HMAC key
// ---------------------------------------------------------------------------

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type SessionPayload = { login: string; exp: number };

/**
 * Creates a signed session token for the given login name.
 * Throws if ADMIN_SESSION_SECRET is not set.
 */
export async function signSessionToken(login: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) throw new Error("[admin] ADMIN_SESSION_SECRET is not configured");

  const payload = b64uEncode(
    new TextEncoder().encode(
      JSON.stringify({ login, exp: Date.now() + SESSION_TTL_SECONDS * 1000 })
    )
  );

  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return `${payload}.${b64uEncode(new Uint8Array(sig))}`;
}

/**
 * Verifies a session token.
 * Returns the payload if valid and not expired, otherwise null.
 * Safe to call from Edge middleware — no Node.js APIs used.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) return null;

  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  try {
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64uDecode(sig),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;

    const data = JSON.parse(new TextDecoder().decode(b64uDecode(payload))) as SessionPayload;
    if (Date.now() > data.exp) return null;

    return data;
  } catch {
    return null;
  }
}

/** Cookie options shared between login (set) and logout (clear). */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
