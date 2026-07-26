import { NextResponse } from "next/server";
import { getMotHistory } from "@/lib/integrations/dvsa-mot";
import {
  buildMotHealthSummary,
  buildMotHistoryFromApi,
  buildMotServiceOpportunities,
} from "@/lib/mot/mot-report";
import { stripPlate } from "@/lib/format-plate";
import { motHistoryQuerySchema, parseBody } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=900, stale-while-revalidate=3600",
};

/**
 * Server-side MOT history lookup — DVSA Trade API (key never exposed to browser).
 * GET /api/mot-history?reg=AB12CDE
 * POST /api/mot-history { "reg": "AB12CDE", "forceRefresh": false }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reg = searchParams.get("reg") ?? "";
  const forceRefresh = searchParams.get("forceRefresh") === "true";
  return handleMotHistory(reg, forceRefresh);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = parseBody(motHistoryQuerySchema, body);
    if (parsed.error) return parsed.error;
    return handleMotHistory(parsed.data.reg, parsed.data.forceRefresh ?? false);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

async function handleMotHistory(reg: string, forceRefresh: boolean) {
  const canon = stripPlate(reg);
  if (canon.length < 2) {
    return NextResponse.json({ error: "Invalid registration" }, { status: 400 });
  }

  const result = await getMotHistory(canon, { forceRefresh });
  const tests = result.data?.motTests ?? [];
  const motHistory = buildMotHistoryFromApi(tests);

  return NextResponse.json(
    {
      reg: canon,
      available: Boolean(tests.length),
      source: result.source,
      fetchedAt: result.fetchedAt,
      cached: result.cached ?? false,
      motHistory,
      motHealthSummary: buildMotHealthSummary(motHistory),
      recommendedActions: buildMotServiceOpportunities(motHistory, []),
      rawTestCount: tests.length,
    },
    { headers: CACHE_HEADERS }
  );
}
