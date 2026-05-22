import { aiIntakeService } from "@/lib/services/ai-intake.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { AiIntakeSubmitInput } from "@/lib/types/ai-intake";

/** Ensure this route is deployed as a serverless function (not statically exported). */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/ai-intake — health check (verify deployment; remove when no longer needed).
 */
export async function GET() {
  return Response.json({ ok: true, route: "ai-intake" });
}

/**
 * POST /api/ai-intake — finalize AI service advisor intake and email workshop.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiIntakeSubmitInput;

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
