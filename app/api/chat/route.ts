import { chatService } from "@/lib/services/chat.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { ChatRequest } from "@/lib/types/chat";

/**
 * POST /api/chat — service advisor intake (mock; Gemini-ready).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const isInit = body.init === true;
    if (!isInit && !body.message?.trim()) {
      return jsonError("message is required");
    }

    const result = await chatService.handleMessage({
      sessionId: body.sessionId,
      message: body.message?.trim(),
      registration: body.registration,
      init: isInit,
    });

    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    return jsonError(message, 500);
  }
}
