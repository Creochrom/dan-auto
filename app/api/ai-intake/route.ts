import { aiIntakeService } from "@/lib/services/ai-intake.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { AiIntakeSubmitInput } from "@/lib/types/ai-intake";

/**
 * POST /api/ai-intake — finalize AI service advisor intake and email workshop.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AiIntakeSubmitInput;

    if (!body.chatSessionId?.trim()) {
      return jsonError("chatSessionId is required");
    }

    const uploadIds = Array.isArray(body.uploadIds)
      ? body.uploadIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .slice(0, 12)
      : undefined;

    const result = await aiIntakeService.submit({
      chatSessionId: body.chatSessionId.trim(),
      uploadIds,
      customerEmail: body.customerEmail?.trim(),
    });

    return jsonOk(result, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI intake submission failed";
    const status = /already sent|not complete|required/i.test(message) ? 409 : 400;
    return jsonError(message, status);
  }
}
