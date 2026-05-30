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

    // Probe every table so the health check pinpoints exactly which migrations
    // are missing. Table names match the migration files:
    //   001 → leads, bookings
    //   002 → chat_sessions, uploads, vehicle_memory
    //   003 → slot_overrides
    //   004 → jobs, job_notes, job_status_events
    const TABLE_PROBES = [
      "leads",
      "bookings",
      "chat_sessions",
      "uploads",
      "vehicle_memory",
      "slot_overrides",
      "jobs",
      "job_notes",
      "job_status_events",
    ] as const;

    const probeResults = await Promise.all(
      TABLE_PROBES.map(async (table) => {
        const { error } = await supabase.from(table).select("id").limit(1);
        return {
          table,
          ok: !error,
          // 42P01 = undefined_table (migration not yet applied)
          missing: error?.code === "42P01",
          error: error && error.code !== "42P01" ? error.message : undefined,
        };
      })
    );

    const latencyMs = Date.now() - start;
    const missingTables = probeResults.filter((r) => r.missing).map((r) => r.table);
    const errorTables = probeResults.filter((r) => r.error);
    const schemaReady = missingTables.length === 0 && errorTables.length === 0;

    return jsonOk({
      storageBackend,
      connected: true,
      schemaReady,
      latencyMs,
      tables: probeResults.map((r) => ({
        table: r.table,
        ok: r.ok,
        ...(r.missing ? { missing: true } : {}),
        ...(r.error ? { error: r.error } : {}),
      })),
      ...(missingTables.length > 0
        ? {
            missingTables,
            hint: `Run migrations that create: ${missingTables.join(", ")}`,
          }
        : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Supabase health check failed";

    if (message.includes("Missing required environment variable")) {
      return jsonError(message, 500);
    }

    return jsonError(`Supabase unreachable: ${message}`, 503);
  }
}
