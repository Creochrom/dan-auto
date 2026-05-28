import { chatService } from "@/lib/services/chat.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import type { ChatRequest } from "@/lib/types/chat";

/**
 * POST /api/chat — service advisor intake (Gemini when GEMINI_API_KEY is set).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = checkRateLimit(`chat:${getClientIp(request)}`, RATE_LIMITS.chat);
  if (!rl.ok) {
    return jsonError("Too many requests — please try again later", 429);
  }

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
      bookingContext: body.bookingContext,
      advisorRoute: body.advisorRoute,
    });

    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    return jsonError(message, 500);
  }
}
