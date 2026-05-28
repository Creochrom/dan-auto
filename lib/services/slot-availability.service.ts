/**
 * Computes slot availability for a given date.
 *
 * Logic (in priority order):
 * 1. If the date is a Sunday → closed (from openingHours config).
 * 2. If a slot_overrides row exists and is_closed=true → closed.
 * 3. The base time-slot grid is bookingTimeSlotsDetailed from lib/config/services.
 *    On Saturday, grid is capped at 12:30 (last slot before 13:00 close).
 * 4. Any time strings in slot_overrides.closed_slots are removed from the grid.
 */

import { slotOverridesRepository } from "@/lib/repositories/slot-overrides.repository";
import { bookingTimeSlotsDetailed } from "@/lib/config/services";
import type { SlotAvailability } from "@/lib/types/slot-availability";

/** Saturday last bookable slot (workshop closes 13:00). */
const SATURDAY_CUTOFF = "13:00";

function dayOfWeek(isoDate: string): number {
  // Returns 0=Sun … 6=Sat without timezone issues (date-only string).
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function baseGrid(isoDate: string): string[] {
  const dow = dayOfWeek(isoDate);
  if (dow === 0) return []; // Sunday — closed in hours config

  const all = [...bookingTimeSlotsDetailed] as string[];

  if (dow === 6) {
    // Saturday: only slots strictly before 13:00
    return all.filter((t) => t < SATURDAY_CUTOFF);
  }

  return all;
}

export async function getSlotAvailability(date: string): Promise<SlotAvailability> {
  const dow = dayOfWeek(date);

  // Sunday is always closed; skip DB read.
  if (dow === 0) {
    return { date, closed: true, available: [] };
  }

  const override = await slotOverridesRepository.findByDate(date);

  if (override?.isClosed) {
    return { date, closed: true, available: [] };
  }

  const grid = baseGrid(date);
  const blocked = new Set(override?.closedSlots ?? []);
  const available = grid.filter((t) => !blocked.has(t));

  return { date, closed: false, available };
}

/** Used by admin calendar endpoints to bulk-fetch a date range. */
export async function getSlotAvailabilityRange(
  from: string,
  to: string
): Promise<SlotAvailability[]> {
  const overrides = await slotOverridesRepository.listRange(from, to);
  const overrideMap = new Map(overrides.map((o) => [o.date, o]));

  // Build ISO date list for [from, to] inclusive.
  const dates: string[] = [];
  const cursor = new Date(from);
  const end = new Date(to);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates.map((date) => {
    const dow = dayOfWeek(date);
    if (dow === 0) return { date, closed: true, available: [] };

    const override = overrideMap.get(date);
    if (override?.isClosed) return { date, closed: true, available: [] };

    const grid = baseGrid(date);
    const blocked = new Set(override?.closedSlots ?? []);
    return { date, closed: false, available: grid.filter((t) => !blocked.has(t)) };
  });
}
