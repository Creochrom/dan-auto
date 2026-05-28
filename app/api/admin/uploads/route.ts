export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { uploadService } from "@/lib/services/upload.service";

/** POST /api/admin/uploads — workshop bay files (admin session, PDF allowed). */
export async function POST(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return jsonError("file is required", 400);
    }

    const upload = await uploadService.storeWorkshopFile(file);
    return jsonOk({ upload }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return jsonError(message, 400);
  }
}
