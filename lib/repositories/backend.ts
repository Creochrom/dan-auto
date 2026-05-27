/**
 * Storage backend selector.
 * Reads STORAGE_BACKEND env var. Default: "mock" (in-memory, safe for dev/CI).
 * Set STORAGE_BACKEND=supabase in .env.local or Vercel dashboard to use real DB.
 */
export function getStorageBackend(): "mock" | "supabase" {
  const value = process.env.STORAGE_BACKEND?.trim().toLowerCase();
  if (value === "supabase") return "supabase";
  return "mock";
}
