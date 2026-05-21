import { NextResponse } from "next/server";
import { lookupVehicle } from "@/lib/vehicle-lookup-server";

export const dynamic = "force-dynamic";

/**
 * Normalized vehicle lookup — ready for DVLA + MOT History API adapters.
 * GET /api/vehicle-lookup?reg=AB12CDE
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reg = searchParams.get("reg") ?? "";

  try {
    const result = lookupVehicle(reg);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=900, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reg?: string };
    const result = lookupVehicle(body.reg ?? "");
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=900, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
