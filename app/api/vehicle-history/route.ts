/**
 * GET /api/vehicle-history?reg=AB12CDE — admin only
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { vehicleHistoryService } from "@/lib/services/vehicle-history.service";

export async function GET(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const reg = new URL(request.url).searchParams.get("reg")?.trim();
  if (!reg) {
    return jsonError("reg query parameter is required", 400);
  }

  try {
    const history = await vehicleHistoryService.getByRegistration(reg);
    if (!history) {
      return jsonError("Invalid registration", 400);
    }
    return jsonOk(history);
  } catch (err) {
    console.error("[GET /api/vehicle-history]", err);
    return jsonError("Failed to load vehicle history", 500);
  }
}
