/**
 * Single source of truth for workshop opening / booking availability.
 *
 * All booking paths (calendar, AI assistant, public API, admin) must use this
 * module — never duplicate Sunday / closure / hours logic elsewhere.
 *
 * Designed so future rules (bank holidays, half-days, technician calendars)
 * can plug into getClosedReason / getAvailableSlots without rewriting callers.
 */

import { bookingTimeSlotsDetailed } from "@/lib/config/services";
import { slotOverridesRepository } from "@/lib/repositories/slot-overrides.repository";
import { workshopClosuresRepository } from "@/lib/repositories/workshop-closures.repository";
import type { SlotAvailability } from "@/lib/types/slot-availability";
import type {
  ClosedReason,
  WorkshopClosure,
} from "@/lib/types/workshop-closure";

/** Saturday last bookable slot (workshop closes 13:00). */
export const SATURDAY_CUTOFF = "13:00";

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class WorkshopClosedError extends Error {
  readonly status = 400;
  readonly code = "WORKSHOP_CLOSED";
  readonly reason: ClosedReason;

  constructor(reason: ClosedReason) {
    super(reason.message);
    this.name = "WorkshopClosedError";
    this.reason = reason;
  }
}

/** Day of week for a YYYY-MM-DD string in local calendar terms (0=Sun … 6=Sat). */
export function dayOfWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getDay();
}

export function isSunday(isoDate: string): boolean {
  return dayOfWeek(isoDate) === 0;
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m! - 1 &&
    dt.getDate() === d
  );
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatUkDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatClosureRange(closure: WorkshopClosure): string {
  if (closure.startDate === closure.endDate) {
    return formatUkDate(closure.startDate);
  }
  return `${formatUkDate(closure.startDate)} and ${formatUkDate(closure.endDate)}`;
}

function sundayReason(): ClosedReason {
  return {
    kind: "sunday",
    label: "Sunday",
    message: "We're closed on Sundays.",
  };
}

function closureReason(closure: WorkshopClosure): ClosedReason {
  const range = formatClosureRange(closure);
  const reasonBit = closure.reason?.trim()
    ? ` (${closure.reason.trim()})`
    : "";
  return {
    kind: "closure",
    label: closure.reason?.trim() || "Workshop closed",
    message: `The workshop is closed between ${range}${reasonBit}. Please choose another available date.`,
    closure,
  };
}

function overrideReason(note?: string | null): ClosedReason {
  return {
    kind: "override",
    label: note?.trim() || "Workshop closed",
    message: note?.trim()
      ? `The workshop is closed on this date (${note.trim()}). Please choose another available date.`
      : "The workshop is closed on this date. Please choose another available date.",
  };
}

/** Base bookable time grid for an open weekday/Saturday — empty on Sunday. */
export function baseTimeGrid(isoDate: string): string[] {
  const dow = dayOfWeek(isoDate);
  if (dow === 0) return [];

  const all = [...bookingTimeSlotsDetailed] as string[];
  if (dow === 6) {
    return all.filter((t) => t < SATURDAY_CUTOFF);
  }
  return all;
}

/**
 * Synchronous permanent rules only (Sunday). Closures / overrides need async.
 */
export function isSundayClosed(isoDate: string): ClosedReason | null {
  if (!isValidIsoDate(isoDate)) return null;
  return isSunday(isoDate) ? sundayReason() : null;
}

/** True when date falls inside a closure period (inclusive). */
export function dateInClosure(isoDate: string, closure: WorkshopClosure): boolean {
  return isoDate >= closure.startDate && isoDate <= closure.endDate;
}

export async function findClosureForDate(
  isoDate: string
): Promise<WorkshopClosure | null> {
  return workshopClosuresRepository.findCoveringDate(isoDate);
}

/**
 * Returns why the workshop is closed on this date, or null if open for bookings
 * (slot-level blocks may still apply).
 */
export async function getClosedReason(
  isoDate: string
): Promise<ClosedReason | null> {
  if (!isValidIsoDate(isoDate)) {
    return {
      kind: "override",
      label: "Invalid date",
      message: "Invalid booking date.",
    };
  }

  const sunday = isSundayClosed(isoDate);
  if (sunday) return sunday;

  const closure = await findClosureForDate(isoDate);
  if (closure) return closureReason(closure);

  const override = await slotOverridesRepository.findByDate(isoDate);
  if (override?.isClosed) return overrideReason(override.note);

  return null;
}

export async function isWorkshopClosed(isoDate: string): Promise<boolean> {
  return Boolean(await getClosedReason(isoDate));
}

export async function isWorkshopOpen(isoDate: string): Promise<boolean> {
  return !(await isWorkshopClosed(isoDate));
}

/**
 * Available time slots for a date. Empty when the whole day is closed.
 * Alias surface for booking calendar / AI / APIs.
 */
export async function getAvailableSlots(isoDate: string): Promise<SlotAvailability> {
  const closed = await getClosedReason(isoDate);
  if (closed) {
    return {
      date: isoDate,
      closed: true,
      available: [],
      closedReason: closed,
    };
  }

  const override = await slotOverridesRepository.findByDate(isoDate);
  const grid = baseTimeGrid(isoDate);
  const blocked = new Set(override?.closedSlots ?? []);
  const available = grid.filter((t) => !blocked.has(t));

  return {
    date: isoDate,
    closed: false,
    available,
  };
}

/** Bulk availability for calendar UIs. */
export async function getAvailableSlotsRange(
  from: string,
  to: string
): Promise<SlotAvailability[]> {
  const [overrides, closures] = await Promise.all([
    slotOverridesRepository.listRange(from, to),
    workshopClosuresRepository.listOverlapping(from, to),
  ]);
  const overrideMap = new Map(overrides.map((o) => [o.date, o]));

  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }

  return dates.map((date) => {
    const sunday = isSundayClosed(date);
    if (sunday) {
      return { date, closed: true, available: [], closedReason: sunday };
    }

    const closure = closures.find((c) => dateInClosure(date, c));
    if (closure) {
      return {
        date,
        closed: true,
        available: [],
        closedReason: closureReason(closure),
      };
    }

    const override = overrideMap.get(date);
    if (override?.isClosed) {
      return {
        date,
        closed: true,
        available: [],
        closedReason: overrideReason(override.note),
      };
    }

    const grid = baseTimeGrid(date);
    const blocked = new Set(override?.closedSlots ?? []);
    return {
      date,
      closed: false,
      available: grid.filter((t) => !blocked.has(t)),
    };
  });
}

/** Next N open workshop dates starting from `from` (inclusive search). */
export async function getNextOpenDates(
  from: string,
  count = 3,
  searchLimit = 60
): Promise<string[]> {
  const start = isValidIsoDate(from) ? from : addDaysIso(new Date().toISOString().slice(0, 10), 0);
  const end = addDaysIso(start, searchLimit);
  const range = await getAvailableSlotsRange(start, end);
  return range
    .filter((d) => !d.closed && d.available.length > 0)
    .slice(0, count)
    .map((d) => d.date);
}

/**
 * Reject bookings on closed dates. Call from POST /api/bookings and intake.
 * Fuzzy non-ISO preferred dates (e.g. "Tomorrow") are skipped — AI paths use
 * soft guidance; calendar / API ISO dates are enforced.
 */
export async function assertBookableDate(preferredDate: string): Promise<void> {
  const trimmed = preferredDate.trim();
  if (!isValidIsoDate(trimmed)) return;

  const reason = await getClosedReason(trimmed);
  if (reason) {
    throw new WorkshopClosedError(reason);
  }
}

/**
 * Detect Sunday / ISO closed dates in free-text customer messages for AI turns.
 * Returns a natural reply + next open dates when a closed request is detected.
 */
export async function resolveClosedDateRequest(params: {
  userMessage: string;
  preferredDate?: string;
}): Promise<{
  closed: boolean;
  reason?: ClosedReason;
  nextOpenDates: string[];
  assistantHint?: string;
} | null> {
  const text = params.userMessage.toLowerCase();
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let candidate: string | null = null;

  if (params.preferredDate && isValidIsoDate(params.preferredDate.trim())) {
    candidate = params.preferredDate.trim();
  } else if (/\bsunday\b/i.test(text)) {
    // Next Sunday from today (or today if Sunday).
    const dow = today.getDay();
    const daysUntil = dow === 0 ? 0 : 7 - dow;
    candidate = addDaysIso(todayIso, daysUntil);
  } else {
    const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoMatch) candidate = isoMatch[1]!;
  }

  if (!candidate) return null;

  const reason = await getClosedReason(candidate);
  if (!reason) return null;

  const nextOpenDates = await getNextOpenDates(addDaysIso(candidate, 1), 3);
  const nextLine =
    nextOpenDates.length > 0
      ? ` Next available: ${nextOpenDates.map(formatUkDate).join(", ")}.`
      : "";

  return {
    closed: true,
    reason,
    nextOpenDates,
    assistantHint: `${reason.message}${nextLine}`,
  };
}

/** Compact prompt block for Gemini booking mode. */
export async function formatAvailabilityPromptBlock(
  from?: string,
  days = 45
): Promise<string> {
  const start =
    from && isValidIsoDate(from)
      ? from
      : (() => {
          const t = new Date();
          return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
        })();
  const end = addDaysIso(start, days);
  const closures = await workshopClosuresRepository.listOverlapping(start, end);

  const closureLines =
    closures.length === 0
      ? "- No temporary closures currently scheduled."
      : closures
          .map(
            (c) =>
              `- Closed ${formatClosureRange(c)}${c.reason ? ` — ${c.reason}` : ""}`
          )
          .join("\n");

  return `
WORKSHOP_AVAILABILITY (authoritative — do not invent open days):
- Sundays are ALWAYS closed. If the customer asks for Sunday, say: "We're closed on Sundays." Then offer the next available dates.
- Temporary closures (inclusive ranges):
${closureLines}
- If the customer asks for a closed date, explain the closure and immediately suggest the next available open dates.
- Never confirm a booking slot on a Sunday or closed day.
`.trim();
}
