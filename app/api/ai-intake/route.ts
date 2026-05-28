import { aiIntakeService } from "@/lib/services/ai-intake.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { aiIntakeSubmitSchema, parseBody } from "@/lib/validation/schemas";

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
  const rl = checkRateLimit(`ai-intake:${getClientIp(req)}`, RATE_LIMITS.aiIntake);
  if (!rl.ok) {
    return jsonError("Too many requests — please try again later", 429);
  }

  try {
    const raw = await req.json();
    const { data, error } = parseBody(aiIntakeSubmitSchema, raw);
    if (error) return error;

    const result = await aiIntakeService.submit({
      chatSessionId: data.chatSessionId,
      uploadIds: data.uploadIds,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      preferredCallbackTime: data.preferredCallbackTime,
      snapshot: data.snapshot as import("@/lib/types/ai-intake").AiIntakeSessionSnapshot | undefined,
    });

    return jsonOk(result, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI intake submission failed";
    const status = /already sent|not complete|required/i.test(message) ? 409 : 400;
    return jsonError(message, status);
  }
}
