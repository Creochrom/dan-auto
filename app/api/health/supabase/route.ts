import { getStorageBackend } from "@/lib/repositories/backend";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api/response";

/**
 * GET /api/health/supabase — verifies server-to-Supabase connectivity.
 *
 * Response shape:
 *   connected: true  + schemaReady: true   — Supabase reachable, tables exist.
 *   connected: true  + schemaReady: false  — Supabase reachable, schema not yet migrated.
 *   500/503                                — env vars missing or network unreachable.
 *
 * Probe: queries `leads` table with LIMIT 1.
 * PostgreSQL error code 42P01 (undefined_table) → schema not migrated yet — expected in Phase 1.
 * Network / fetch failure → Supabase unreachable.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const storageBackend = getStorageBackend();

  if (storageBackend !== "supabase") {
    return jsonOk({
      storageBackend,
      connected: false,
      schemaReady: false,
      message:
        "STORAGE_BACKEND is not supabase — bookings use in-memory mock storage.",
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    const start = Date.now();

    const { error } = await supabase.from("leads").select("id").limit(1);

    const latencyMs = Date.now() - start;

    if (!error) {
      return jsonOk({
        storageBackend,
        connected: true,
        schemaReady: true,
        latencyMs,
      });
    }

    // 42P01 = undefined_table — Supabase is reachable but schema not yet migrated.
    if (error.code === "42P01") {
      return jsonOk({
        storageBackend,
        connected: true,
        schemaReady: false,
        latencyMs,
      });
    }

    // Any other Supabase/PostgREST error still proves network connectivity.
    return jsonOk({
      storageBackend,
      connected: true,
      schemaReady: false,
      latencyMs,
      detail: error.message,
    });
  } catch (e) {
    // Config error (missing env vars) or hard network failure.
    const message = e instanceof Error ? e.message : "Supabase health check failed";

    // Distinguish config errors from network errors for easier diagnosis.
    if (message.includes("Missing required environment variable")) {
      return jsonError(message, 500);
    }

    return jsonError(`Supabase unreachable: ${message}`, 503);
  }
}
