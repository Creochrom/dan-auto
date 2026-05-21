import { uploadService } from "@/lib/services/upload.service";
import { jsonError, jsonOk } from "@/lib/api/response";

/**
 * POST /api/uploads — mock media storage (Supabase + Vision later).
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return jsonError("file is required");
    }

    const upload = await uploadService.storeFile(file);
    return jsonOk({ upload }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return jsonError(message, 400);
  }
}
