export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { uploadRepository } from "@/lib/repositories/upload.repository";
import { resolveUploadPreview } from "@/lib/services/upload.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  if (!id?.trim()) return jsonError("Upload id required", 400);

  try {
    const upload = await uploadRepository.findById(id.trim());
    if (!upload) return jsonError("Upload not found", 404);
    return jsonOk({ upload: await resolveUploadPreview(upload) });
  } catch (err) {
    console.error("[admin/uploads/[id]] GET error:", err);
    return jsonError("Failed to load upload", 500);
  }
}
