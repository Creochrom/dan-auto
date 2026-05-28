export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAnythingLlmConfigured } from "@/lib/copilot/config";
import { anythingllmKnowledgeService } from "@/lib/services/anythingllm-knowledge.service";

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  if (!isAnythingLlmConfigured()) {
    return jsonError("AnythingLLM is not configured. Set ANYTHINGLLM_* env vars.", 500);
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("file is required", 400);
    }
    if (file.size <= 0) {
      return jsonError("File is empty", 400);
    }
    if (file.size > 50 * 1024 * 1024) {
      return jsonError("File must be <= 50MB", 400);
    }
    if (file.type && !SUPPORTED_TYPES.has(file.type)) {
      return jsonError("Unsupported file type", 400);
    }

    await anythingllmKnowledgeService.uploadDocument(file);
    return jsonOk({ uploaded: true }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonError(message, 500);
  }
}
