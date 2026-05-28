import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { copilotService } from "@/lib/services/copilot.service";
import { copilotAskSchema, parseBody } from "@/lib/validation/schemas";

/**
 * POST /api/copilot — internal workshop AI copilot (admin only).
 * Does not replace POST /api/chat (customer service advisor).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const raw = await request.json();
    const { data, error } = parseBody(copilotAskSchema, raw);
    if (error) return error;

    const result = await copilotService.ask({
      message: data.message,
      promptKind: data.promptKind,
      context: data.context,
      jobId: data.jobId,
      jobSnapshot: data.jobSnapshot,
    });

    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Copilot request failed";
    console.error("[copilot]", message);
    return jsonError(message, 500);
  }
}
