import { uploadService } from "@/lib/services/upload.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/uploads — mock media storage (Supabase + Vision later).
 */
export async function POST(request: Request) {
  const rl = checkRateLimit(`uploads:${getClientIp(request)}`, RATE_LIMITS.uploads);
  if (!rl.ok) {
    return jsonError("Too many requests — please try again later", 429);
  }

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
