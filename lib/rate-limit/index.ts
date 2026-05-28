/**
 * In-memory sliding window rate limiter.
 *
 * Designed for Vercel serverless: good protection on a single warm instance.
 * Each new cold-start resets state, which is acceptable for current traffic.
 *
 * Upgrade path to distributed limiting (Upstash Redis):
 *   1. npm install @upstash/ratelimit @upstash/redis
 *   2. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel.
 *   3. Replace checkRateLimit() body with the Upstash Ratelimit adapter.
 *      The function signature and response shape stay identical, so routes
 *      require no changes.
 *
 * State lives on globalThis (same pattern as mock-store.ts) so it survives
 * Next.js hot-reloads in dev without resetting between requests.
 */

const STORE_KEY = "__danAutoRateLimit";

type Window = {
  count: number;
  /** Unix ms at which this window expires and count resets. */
  resetAt: number;
};

type Store = Map<string, Window>;

function getStore(): Store {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map();
  return g[STORE_KEY];
}

export type RateLimitConfig = {
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Maximum number of requests allowed within the window. */
  max: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

/**
 * Check and increment the counter for `key`.
 * Key should be `"<route>:<ip>"` to keep routes isolated.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (existing.count >= config.max) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count++;
  return { ok: true };
}

/**
 * Extracts the client IP from Vercel / standard proxy headers.
 * Falls back to "unknown" (treated as a single bucket) when headers are absent.
 */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// ---------------------------------------------------------------------------
// Per-route configs
// ---------------------------------------------------------------------------

export const RATE_LIMITS = {
  /** Chat is interactive — generous window, still blocks scripted flooding. */
  chat: { windowMs: 60_000, max: 30 } satisfies RateLimitConfig,
  /** Lead capture — tight to prevent form spam. */
  leads: { windowMs: 60_000, max: 10 } satisfies RateLimitConfig,
  /** File uploads — covers upload cost and storage abuse. */
  uploads: { windowMs: 60_000, max: 15 } satisfies RateLimitConfig,
  /** AI intake triggers email sends — tightest limit. */
  aiIntake: { windowMs: 60_000, max: 5 } satisfies RateLimitConfig,
} as const;
