/**
 * Zod schemas for public POST routes.
 *
 * Rules:
 *  - Schemas mirror the shape of the corresponding CreateXxxInput types
 *    from lib/types/ but enforce length caps and basic format rules.
 *  - Internal-only fields (intakeSummary, uploadIds set by services, snapshot
 *    AI structure) are either stripped or loosely typed — they must not break
 *    the AI contract or lib/types/structured-intake.ts.
 *  - Empty strings are coerced to undefined for optional fields so callers
 *    that send "" and callers that omit the field are treated identically.
 *  - parseBodyOrError() is the single integration point for routes.
 */

import { z } from "zod";
import { jsonError } from "@/lib/api/response";

// ---------------------------------------------------------------------------
// Re-usable field helpers
// ---------------------------------------------------------------------------

/** Trim + coerce empty string → undefined for optional text fields. */
const optStr = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional()
  );

/** Required non-empty string with max length. */
const reqStr = (max: number) => z.string().trim().min(1).max(max);

/** Optional email — coerces "" to undefined, validates format when present. */
const optEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().email("Invalid email address").max(254).optional()
);

// ---------------------------------------------------------------------------
// /api/leads  POST
// ---------------------------------------------------------------------------

export const createLeadSchema = z.object({
  name: reqStr(100),
  phone: reqStr(30),
  email: optEmail,
  registration: optStr(10),
  vehicleModel: optStr(100),
  problemDescription: optStr(2000),
  preferredDate: optStr(50),
  source: z
    .enum(["website", "assistant", "contact_form", "callback"])
    .optional(),
  aiSummary: optStr(5000),
});

// ---------------------------------------------------------------------------
// /api/bookings  POST  (public fields only — intakeSummary set by services)
// ---------------------------------------------------------------------------

export const createBookingSchema = z.object({
  service: reqStr(100),
  registration: reqStr(10),
  vehicleModel: optStr(100),
  preferredDate: reqStr(50),
  preferredTime: reqStr(50),
  duration: optStr(20),
  customerName: reqStr(100),
  customerPhone: reqStr(30),
  customerEmail: optEmail,
  notes: optStr(2000),
  source: z.enum(["website", "assistant", "admin", "phone"]).optional(),
});

// ---------------------------------------------------------------------------
// /api/bookings PATCH (admin status updates)
// ---------------------------------------------------------------------------

export const updateBookingStatusSchema = z.object({
  id: reqStr(128),
  status: z.enum([
    "new",
    "awaiting_callback",
    "confirmed",
    "rescheduled",
    "rejected",
    "in_progress",
    "completed",
  ]),
});

export const updateBookingSchema = z
  .object({
    id: reqStr(128),
    status: z
      .enum([
        "new",
        "awaiting_callback",
        "confirmed",
        "rescheduled",
        "rejected",
        "in_progress",
        "completed",
      ])
      .optional(),
    preferredDate: optStr(50),
    preferredTime: optStr(50),
    notes: optStr(2000),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.preferredDate !== undefined ||
      data.preferredTime !== undefined ||
      data.notes !== undefined,
    { message: "Provide at least one of status, preferredDate, preferredTime, notes" }
  );

// ---------------------------------------------------------------------------
// /api/leads PATCH (admin status updates)
// ---------------------------------------------------------------------------

export const updateLeadStatusSchema = z.object({
  id: reqStr(128),
  status: z.enum(["new", "contacted", "qualified", "converted", "closed"]),
});

// ---------------------------------------------------------------------------
// /api/ai-intake  POST
// snapshot is the AI session fallback structure — pass through without
// deep validation to avoid coupling to lib/types/structured-intake.ts.
// ---------------------------------------------------------------------------

export const aiIntakeSubmitSchema = z.object({
  chatSessionId: reqStr(128),
  uploadIds: z.array(z.string().trim().min(1).max(128)).max(12).optional(),
  customerEmail: optEmail,
  customerName: optStr(100),
  customerPhone: optStr(30),
  preferredCallbackTime: optStr(200),
  snapshot: z.unknown().optional(),
});

// ---------------------------------------------------------------------------
// /api/copilot  POST (admin session — internal workshop tool)
// ---------------------------------------------------------------------------

export const copilotAskSchema = z.object({
  message: reqStr(4000),
  promptKind: z.enum([
    "diagnostics",
    "customer_explanation",
    "workshop_notes",
    "intake_frontdesk_summary",
    "intake_service_category",
  ]),
  context: optStr(8000),
  jobId: z.string().optional(),
  jobSnapshot: z
    .object({
      registration: z.string(),
      symptoms: z.string(),
      notes: z.string().optional(),
      recentTimeline: z.array(z.string()).max(20).optional(),
      vehicleHistory: z.array(z.string()).max(20).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// /api/mot-history  GET query / POST
// ---------------------------------------------------------------------------

export const motHistoryQuerySchema = z.object({
  reg: reqStr(10),
  forceRefresh: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Shared parse helper
// ---------------------------------------------------------------------------

/**
 * Parses `body` against `schema`. On failure returns a `jsonError` 400
 * response with the first field-level message. On success returns `{ data }`.
 */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
):
  | { data: z.infer<T>; error: null }
  | { data: null; error: ReturnType<typeof jsonError> } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
    return { data: null, error: jsonError(`${field}${first.message}`, 400) };
  }
  return { data: result.data as z.infer<T>, error: null };
}
