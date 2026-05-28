/**
 * GET /api/booking-slots?date=YYYY-MM-DD
 * Public read — returns available time slots for a given date.
 * No auth required; slot data is not sensitive.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonOk, jsonError } from "@/lib/api/response";
import { getSlotAvailability } from "@/lib/services/slot-availability.service";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !ISO_DATE_RE.test(date)) {
    return jsonError("Missing or invalid ?date=YYYY-MM-DD", 400);
  }

  try {
    const availability = await getSlotAvailability(date);
    return jsonOk(availability);
  } catch (err) {
    console.error("[booking-slots] GET error:", err);
    return jsonError("Failed to fetch slot availability", 500);
  }
}
