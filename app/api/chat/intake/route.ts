import { chatService } from "@/lib/services/chat.service";
import { jsonError, jsonOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/chat/intake?sessionId= — export structured repair intake for mechanic review.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return jsonError("sessionId query parameter is required", 400);
    }

    const exportData = await chatService.getIntakeExport(sessionId);
    if (!exportData) {
      return jsonError("Session not found", 404);
    }

    return jsonOk(exportData);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Intake export failed";
    return jsonError(message, 500);
  }
}
