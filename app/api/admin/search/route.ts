export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { workshopSearchGrouped } from "@/lib/services/workshop-search-grouped";
import { workshopSearch } from "@/lib/services/workshop-search.service";

export async function GET(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const grouped = params.get("grouped") === "1";

  if (q.length < 2) {
    return jsonOk({ results: [], query: q, ...(grouped ? { groups: [] } : {}) });
  }

  try {
    if (grouped) {
      const { results, groups } = await workshopSearchGrouped(q);
      return jsonOk({ results, groups, query: q });
    }
    const results = await workshopSearch(q);
    return jsonOk({ results, query: q });
  } catch (err) {
    console.error("[admin/search] error:", err);
    return jsonError("Search failed", 500);
  }
}
