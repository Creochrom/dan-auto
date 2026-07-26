/**
 * Admin workshop closures API.
 *
 * GET    /api/admin/workshop-closures
 * POST   /api/admin/workshop-closures  { startDate, endDate, reason? }
 * PATCH  /api/admin/workshop-closures  { id, startDate?, endDate?, reason? }
 * DELETE /api/admin/workshop-closures?id=UUID
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { workshopClosuresRepository } from "@/lib/repositories/workshop-closures.repository";
import { ISO_DATE_RE, isValidIsoDate } from "@/lib/workshop/availability";

export async function GET() {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  try {
    const closures = await workshopClosuresRepository.listAll();
    return jsonOk({ closures });
  } catch (err) {
    console.error("[admin/workshop-closures] GET error:", err);
    return jsonError("Failed to fetch workshop closures", 500);
  }
}

export async function POST(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("Body must be an object", 400);
  }

  const b = body as Record<string, unknown>;
  const startDate = typeof b.startDate === "string" ? b.startDate.trim() : "";
  const endDate = typeof b.endDate === "string" ? b.endDate.trim() : "";
  const reason =
    typeof b.reason === "string" && b.reason.trim() ? b.reason.trim() : null;

  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    return jsonError("startDate and endDate (YYYY-MM-DD) are required", 400);
  }
  if (endDate < startDate) {
    return jsonError("endDate must be on or after startDate", 400);
  }

  try {
    const closure = await workshopClosuresRepository.create({
      startDate,
      endDate,
      reason,
    });
    return jsonOk(closure, 201);
  } catch (err) {
    console.error("[admin/workshop-closures] POST error:", err);
    return jsonError("Failed to create workshop closure", 500);
  }
}

export async function PATCH(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("Body must be an object", 400);
  }

  const b = body as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id.trim() : "";
  if (!id) return jsonError("id is required", 400);

  const patch: {
    startDate?: string;
    endDate?: string;
    reason?: string | null;
  } = {};

  if (typeof b.startDate === "string") {
    if (!ISO_DATE_RE.test(b.startDate) || !isValidIsoDate(b.startDate)) {
      return jsonError("Invalid startDate", 400);
    }
    patch.startDate = b.startDate;
  }
  if (typeof b.endDate === "string") {
    if (!ISO_DATE_RE.test(b.endDate) || !isValidIsoDate(b.endDate)) {
      return jsonError("Invalid endDate", 400);
    }
    patch.endDate = b.endDate;
  }
  if (b.reason === null) patch.reason = null;
  else if (typeof b.reason === "string") patch.reason = b.reason.trim() || null;

  const start = patch.startDate;
  const end = patch.endDate;
  if (start && end && end < start) {
    return jsonError("endDate must be on or after startDate", 400);
  }

  try {
    const updated = await workshopClosuresRepository.update(id, patch);
    if (!updated) return jsonError("Closure not found", 404);
    if (updated.endDate < updated.startDate) {
      return jsonError("endDate must be on or after startDate", 400);
    }
    return jsonOk(updated);
  } catch (err) {
    console.error("[admin/workshop-closures] PATCH error:", err);
    return jsonError("Failed to update workshop closure", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) return jsonError("Missing ?id=", 400);

  try {
    const deleted = await workshopClosuresRepository.deleteById(id);
    if (!deleted) return jsonError("Closure not found", 404);
    return jsonOk({ deleted: id });
  } catch (err) {
    console.error("[admin/workshop-closures] DELETE error:", err);
    return jsonError("Failed to delete workshop closure", 500);
  }
}
