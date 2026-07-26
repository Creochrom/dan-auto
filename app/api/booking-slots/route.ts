/**
 * GET /api/booking-slots?date=YYYY-MM-DD
 * GET /api/booking-slots?from=YYYY-MM-DD&to=YYYY-MM-DD  (calendar range)
 *
 * Public read — returns available time slots. No auth required.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonOk, jsonError } from "@/lib/api/response";
import {
  getAvailableSlots,
  getAvailableSlotsRange,
  ISO_DATE_RE,
  isValidIsoDate,
} from "@/lib/workshop/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    if (from && to) {
      if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
        return jsonError("Invalid from/to — use YYYY-MM-DD", 400);
      }
      if (to < from) return jsonError("to must be on or after from", 400);
      const availability = await getAvailableSlotsRange(from, to);
      return jsonOk({ availability });
    }

    if (!date || !ISO_DATE_RE.test(date) || !isValidIsoDate(date)) {
      return jsonError("Missing or invalid ?date=YYYY-MM-DD", 400);
    }

    const availability = await getAvailableSlots(date);
    return jsonOk(availability);
  } catch (err) {
    console.error("[booking-slots] GET error:", err);
    return jsonError("Failed to fetch slot availability", 500);
  }
}
