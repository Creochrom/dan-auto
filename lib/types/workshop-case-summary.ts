/**
 * Canonical mechanic-ready case summary — shared across callback/booking handoffs,
 * workshop emails, and admin cards.
 */

import type { IntakeDrivability, IntakeIntent } from "@/lib/types/ai-intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";

export const WORKSHOP_CASE_JSON_MARKER = "_type";
export const WORKSHOP_CASE_JSON_TYPE = "workshop_case_v1";

export type WorkshopCaseKind =
  | "callback"
  | "booking"
  | "pricing"
  | "diagnostic"
  | "recovery";

export type WorkshopCaseSummary = {
  kind: WorkshopCaseKind;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  registration: string;
  /** Year make model (display line). */
  vehicle?: string;
  /** Engine / fuel line e.g. "2.0L Diesel". */
  vehicleEngine?: string;
  /** Primary symptom category e.g. "Overheating", "Warning light". */
  primarySymptom?: string;
  symptoms: string;
  /** Driving-related symptoms — power loss, pulling, vibration. */
  drivingSymptoms?: string;
  /** Primary issue label e.g. "Overheating". */
  issueTitle?: string;
  /** When symptoms started. */
  timeline?: string;
  /** Severity label from structured intake. */
  severity?: string;
  /** Customer objective or requested work. */
  requestedAction?: string;
  customerObjective?: string;
  /** Recovery / collection fields. */
  collectionAddress?: string;
  collectionDistance?: string;
  collectionPreferredWindow?: string;
  /** Why the customer wants a callback (pricing, diagnosis, etc.). */
  callbackReason?: string;
  /** Service / repair reason for bookings. */
  bookingReason?: string;
  estimatedRange?: string;
  urgency: UrgencyLevel;
  drivability: IntakeDrivability;
  drivabilityNote?: string;
  preferredDate?: string;
  preferredTime?: string;
  /** Mechanic next step from AI estimate. */
  recommendedAction?: string;
  possibleCauses?: string[];
  /** Diagnostic confidence after investigation — low | medium | high. */
  confidenceLevel?: "low" | "medium" | "high";
  warningLights?: string[];
  intent?: IntakeIntent;
  chatSessionId?: string;
  preparedAt: string;
};

export function serializeWorkshopCaseForLead(caseSummary: WorkshopCaseSummary): string {
  return JSON.stringify({
    [WORKSHOP_CASE_JSON_MARKER]: WORKSHOP_CASE_JSON_TYPE,
    ...caseSummary,
  });
}

export function parseWorkshopCaseFromLead(aiSummary?: string): WorkshopCaseSummary | undefined {
  if (!aiSummary?.trim().startsWith("{")) return undefined;
  try {
    const parsed = JSON.parse(aiSummary) as WorkshopCaseSummary & {
      [WORKSHOP_CASE_JSON_MARKER]?: string;
    };
    if (parsed[WORKSHOP_CASE_JSON_MARKER] !== WORKSHOP_CASE_JSON_TYPE) return undefined;
    if (!parsed.kind || !parsed.customerName) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function resolveWorkshopCaseFromLead(lead: {
  aiSummary?: string;
  name: string;
  phone: string;
  registration?: string;
  vehicleModel?: string;
  problemDescription?: string;
  preferredDate?: string;
}): WorkshopCaseSummary | undefined {
  const stored = parseWorkshopCaseFromLead(lead.aiSummary);
  if (stored) return stored;

  if (!lead.problemDescription?.trim()) return undefined;

  return {
    kind: "callback",
    customerName: lead.name,
    customerPhone: lead.phone,
    registration: lead.registration ?? "TBC",
    vehicle: lead.vehicleModel,
    symptoms: lead.problemDescription,
    urgency: "medium",
    drivability: "unknown",
    preferredDate: lead.preferredDate,
    preparedAt: new Date().toISOString(),
  };
}

export function resolveWorkshopCaseFromBooking(booking: {
  service: string;
  registration: string;
  vehicleModel?: string;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  intakeSummary?: {
    symptoms?: string;
    estimatedRange?: string;
    urgency?: UrgencyLevel;
    severityNote?: string;
    possibleCauses?: string[];
    caseSummary?: WorkshopCaseSummary;
  };
}): WorkshopCaseSummary {
  const nested = booking.intakeSummary?.caseSummary;
  if (nested) return nested;

  return {
    kind: "booking",
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    registration: booking.registration,
    vehicle: booking.vehicleModel,
    symptoms: booking.intakeSummary?.symptoms ?? "",
    bookingReason: booking.service,
    estimatedRange: booking.intakeSummary?.estimatedRange,
    urgency: booking.intakeSummary?.urgency ?? "medium",
    drivability: "unknown",
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
    recommendedAction: booking.intakeSummary?.severityNote,
    possibleCauses: booking.intakeSummary?.possibleCauses,
    preparedAt: new Date().toISOString(),
  };
}
