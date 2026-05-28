/**
 * Admin slot-overrides API.
 *
 * GET  /api/admin/slot-overrides?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   → lists overrides in a date range (defaults: today … +30 days)
 *
 * POST /api/admin/slot-overrides
 *   Body: { date, isClosed, closedSlots?, capacity?, note? }
 *   → upserts a day override
 *
 * DELETE /api/admin/slot-overrides?date=YYYY-MM-DD
 *   → removes an override (restores default open state)
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { slotOverridesRepository } from "@/lib/repositories/slot-overrides.repository";
import { getSlotAvailabilityRange } from "@/lib/services/slot-availability.service";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? todayIso();
  const to = searchParams.get("to") ?? addDays(from, 30);

  if (!ISO_DATE_RE.test(from) || !ISO_DATE_RE.test(to)) {
    return jsonError("Invalid date format — use YYYY-MM-DD", 400);
  }

  try {
    const [overrides, availability] = await Promise.all([
      slotOverridesRepository.listRange(from, to),
      getSlotAvailabilityRange(from, to),
    ]);
    return jsonOk({ overrides, availability });
  } catch (err) {
    console.error("[admin/slot-overrides] GET error:", err);
    return jsonError("Failed to fetch slot overrides", 500);
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

  const date = b.date;
  if (typeof date !== "string" || !ISO_DATE_RE.test(date)) {
    return jsonError("date (YYYY-MM-DD) is required", 400);
  }

  const isClosed = b.isClosed === true || b.isClosed === false ? b.isClosed : false;

  const closedSlots =
    Array.isArray(b.closedSlots) && b.closedSlots.every((s) => typeof s === "string")
      ? (b.closedSlots as string[])
      : null;

  const capacity =
    typeof b.capacity === "number" && b.capacity > 0
      ? Math.floor(b.capacity)
      : null;

  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim() : null;

  try {
    const override = await slotOverridesRepository.upsert({
      date,
      isClosed,
      closedSlots,
      capacity,
      note,
    });
    return jsonOk(override, 201);
  } catch (err) {
    console.error("[admin/slot-overrides] POST error:", err);
    return jsonError("Failed to save slot override", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !ISO_DATE_RE.test(date)) {
    return jsonError("Missing or invalid ?date=YYYY-MM-DD", 400);
  }

  try {
    await slotOverridesRepository.deleteByDate(date);
    return jsonOk({ deleted: date });
  } catch (err) {
    console.error("[admin/slot-overrides] DELETE error:", err);
    return jsonError("Failed to delete slot override", 500);
  }
}
