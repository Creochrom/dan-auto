import { chatService } from "@/lib/services/chat.service";
import { jsonOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/chat/status — which advisor engine is active (debug / UI). */
export async function GET() {
  return jsonOk(chatService.getStatus());
}
