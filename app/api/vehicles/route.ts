import { lookupVehicle } from "@/lib/vehicle-lookup-server";
import { jsonError, jsonOk } from "@/lib/api/response";

/**
 * GET/POST /api/vehicles?reg=AB12CDE — vehicle lookup facade.
 * Delegates to existing DVLA/workshop lookup pipeline.
 * TODO: Unify with /api/vehicle-lookup or deprecate duplicate route.
 */
export async function GET(request: Request) {
  const reg = new URL(request.url).searchParams.get("reg");
  if (!reg?.trim()) return jsonError("reg query parameter is required");

  try {
    const result = await lookupVehicle(reg.trim());
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reg?: string };
    const reg = body.reg?.trim();
    if (!reg) return jsonError("reg is required");

    const result = await lookupVehicle(reg);
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed";
    return jsonError(message, 500);
  }
}
