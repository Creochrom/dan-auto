export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAnythingLlmConfigured } from "@/lib/copilot/config";
import { anythingllmKnowledgeService } from "@/lib/services/anythingllm-knowledge.service";

export async function GET() {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  if (!isAnythingLlmConfigured()) {
    return jsonError("AnythingLLM is not configured. Set ANYTHINGLLM_* env vars.", 500);
  }

  try {
    const documents = await anythingllmKnowledgeService.listDocuments();
    return jsonOk({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load knowledge docs";
    return jsonError(message, 500);
  }
}
