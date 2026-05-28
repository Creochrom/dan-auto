export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { uploadRepository } from "@/lib/repositories/upload.repository";
import { resolveUploadPreview } from "@/lib/services/upload.service";

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const ids = Array.isArray((body as { ids?: unknown }).ids)
    ? (body as { ids: unknown[] }).ids
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .map((id) => id.trim())
        .slice(0, 24)
    : [];

  if (ids.length === 0) {
    return jsonOk({ uploads: {} });
  }

  try {
    const rows = await uploadRepository.findMany(ids);
    const resolved = await Promise.all(rows.map(resolveUploadPreview));
    const uploads: Record<string, (typeof resolved)[number]> = {};
    for (const row of resolved) {
      uploads[row.id] = row;
    }
    return jsonOk({ uploads });
  } catch (err) {
    console.error("[admin/uploads/batch] error:", err);
    return jsonError("Failed to load uploads", 500);
  }
}
