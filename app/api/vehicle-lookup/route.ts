import { NextResponse } from "next/server";
import { lookupVehicle } from "@/lib/vehicle-lookup-server";
import { DvlaServiceError } from "@/lib/services/dvla/dvla.types";
import { stripPlate } from "@/lib/format-plate";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=900, stale-while-revalidate=3600",
};

/**
 * Normalized vehicle lookup — DVLA Vehicle Enquiry API (server-side only).
 * GET /api/vehicle-lookup?reg=AB12CDE
 * POST /api/vehicle-lookup { "reg": "AB12CDE" }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reg = searchParams.get("reg") ?? "";

  return handleLookup(reg);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reg?: string; registrationNumber?: string };
    const reg = body.reg ?? body.registrationNumber ?? "";
    return handleLookup(reg);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

async function handleLookup(reg: string) {
  const canon = stripPlate(reg);
  if (canon.length < 2) {
    console.warn("[vehicle-lookup] rejected invalid registration", reg);
    return NextResponse.json({ error: "Invalid registration" }, { status: 400 });
  }

  try {
    const result = await lookupVehicle(reg);
    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (e) {
    if (e instanceof DvlaServiceError) {
      // 422 — unknown plate; avoid HTTP 404 (looks like a missing App Router route in DevTools)
      const status = e.statusCode === 404 ? 422 : e.statusCode;
      return NextResponse.json({ error: e.message }, { status });
    }
    const message = e instanceof Error ? e.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
