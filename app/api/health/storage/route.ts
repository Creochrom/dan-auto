/**
 * GET /api/health/storage
 *
 * Probes Supabase Storage for the workshop uploads bucket.
 * Lists the bucket root (limit 1) to verify connectivity and permissions.
 *
 * Response: { configured, reachable, bucket }
 * Admin session required.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonOk } from "@/lib/api/response";
import { getStorageBackend } from "@/lib/repositories/backend";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkshopStorageBucket } from "@/lib/supabase/workshop-storage";

function isSupabaseEnvConfigured(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const bucket = getWorkshopStorageBucket();
  const storageBackend = getStorageBackend();
  const configured =
    storageBackend === "supabase" && isSupabaseEnvConfigured();

  if (!configured) {
    return jsonOk({
      configured: false,
      reachable: false,
      bucket,
      message:
        storageBackend !== "supabase"
          ? "STORAGE_BACKEND is not supabase — workshop files use in-memory data URLs."
          : "Supabase env vars missing — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const t0 = Date.now();
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.storage.from(bucket).list("", {
      limit: 1,
    });
    const latencyMs = Date.now() - t0;

    if (error) {
      return jsonOk({
        configured: true,
        reachable: false,
        bucket,
        latencyMs,
        message: `Storage bucket not reachable: ${error.message}`,
      });
    }

    return jsonOk({
      configured: true,
      reachable: true,
      bucket,
      latencyMs,
      message: `Workshop storage bucket "${bucket}" is reachable.`,
    });
  } catch (e) {
    return jsonOk({
      configured: true,
      reachable: false,
      bucket,
      latencyMs: Date.now() - t0,
      message: e instanceof Error ? e.message : "Storage health check failed",
    });
  }
}
