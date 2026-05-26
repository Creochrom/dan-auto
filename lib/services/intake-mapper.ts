import type { BookingChatContext, LeadDraft } from "@/lib/types/chat";
import type { IntakeSeverity, IntakeState, MechanicIntakeSummary } from "@/lib/types/intake";
import {
  createEmptyStructuredIntake,
  type StructuredIntake,
} from "@/lib/types/structured-intake";

/**
 * Merge a partial Gemini extraction onto the session-resident intake.
 *
 * Key rule: never wipe a populated field with a blank one. Gemini will often
 * echo back a subset of the schema (e.g. just `intent`) and leave other
 * strings as `""` — we must treat empty/whitespace strings as "unspecified
 * for this turn" rather than as an authoritative reset.
 */
export function mergeStructuredIntake(
  current: StructuredIntake | undefined,
  incoming: Partial<StructuredIntake> | undefined
): StructuredIntake {
  const base = current ?? createEmptyStructuredIntake();
  if (!incoming) return base;

  return {
    customer: {
      name: pickString(incoming.customer?.name, base.customer.name),
      contact: pickString(incoming.customer?.contact, base.customer.contact),
    },
    vehicle: {
      make: pickString(incoming.vehicle?.make, base.vehicle.make),
      model: pickString(incoming.vehicle?.model, base.vehicle.model),
      year: pickString(incoming.vehicle?.year, base.vehicle.year),
      engine: pickString(incoming.vehicle?.engine, base.vehicle.engine),
      mileage: pickString(incoming.vehicle?.mileage, base.vehicle.mileage),
    },
    issue: {
      symptoms: incoming.issue?.symptoms?.length
        ? incoming.issue.symptoms
        : base.issue.symptoms,
      warningLights: incoming.issue?.warningLights?.length
        ? incoming.issue.warningLights
        : base.issue.warningLights,
      startedWhen: pickString(incoming.issue?.startedWhen, base.issue.startedWhen),
      drivable:
        incoming.issue?.drivable === true || incoming.issue?.drivable === false
          ? incoming.issue.drivable
          : base.issue.drivable,
      severity: pickString(incoming.issue?.severity, base.issue.severity),
    },
    media: incoming.media?.length ? incoming.media : base.media,
    aiEstimate: {
      possibleCauses: incoming.aiEstimate?.possibleCauses?.length
        ? incoming.aiEstimate.possibleCauses
        : base.aiEstimate.possibleCauses,
      estimatedPriceRange: pickString(
        incoming.aiEstimate?.estimatedPriceRange,
        base.aiEstimate.estimatedPriceRange
      ),
      urgencyLevel: pickString(
        incoming.aiEstimate?.urgencyLevel,
        base.aiEstimate.urgencyLevel
      ),
      recommendedNextStep: pickString(
        incoming.aiEstimate?.recommendedNextStep,
        base.aiEstimate.recommendedNextStep
      ),
      summary: pickString(incoming.aiEstimate?.summary, base.aiEstimate.summary),
    },
    intent: incoming.intent && incoming.intent.trim() ? incoming.intent : base.intent,
    preferredBookingTime: pickString(
      incoming.preferredBookingTime,
      base.preferredBookingTime
    ),
  };
}

function pickString(
  incoming: string | undefined | null,
  base: string
): string {
  if (typeof incoming === "string" && incoming.trim().length > 0) return incoming;
  return base;
}

function parseSeverity(raw: string | undefined): IntakeSeverity {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("high") || s.includes("urgent")) return "high";
  if (s.includes("low")) return "low";
  return "medium";
}

/** Map structured intake into legacy lead + mechanic shapes used by email/CRM. */
export function structuredIntakeToLeadDraft(
  intake: StructuredIntake,
  existing: LeadDraft = {}
): LeadDraft {
  const vehicleParts = [intake.vehicle.make, intake.vehicle.model, intake.vehicle.year]
    .filter(Boolean)
    .join(" ");

  return {
    ...existing,
    name: intake.customer.name || existing.name,
    phone: intake.customer.contact || existing.phone,
    vehicleModel: vehicleParts || existing.vehicleModel,
    problemDescription:
      intake.issue.symptoms.join("; ") || existing.problemDescription,
    urgency: intake.aiEstimate.urgencyLevel || existing.urgency,
  };
}

export function structuredIntakeToMechanicSummary(
  intake: StructuredIntake,
  registrationHint?: string
): MechanicIntakeSummary | undefined {
  const symptoms = intake.issue.symptoms.join("; ").trim();
  if (!symptoms && !intake.aiEstimate.possibleCauses.length) return undefined;

  const vehicle = [intake.vehicle.year, intake.vehicle.make, intake.vehicle.model]
    .filter(Boolean)
    .join(" ");

  return {
    vehicle: vehicle || undefined,
    registration: registrationHint,
    symptoms: symptoms || "See chat transcript",
    possibleCauses: intake.aiEstimate.possibleCauses,
    estimatedRange: intake.aiEstimate.estimatedPriceRange || "Indicative only — inspection required",
    severity: parseSeverity(intake.issue.severity || intake.aiEstimate.urgencyLevel),
    severityNote: intake.aiEstimate.recommendedNextStep,
    callbackRequested: Boolean(intake.customer.name && intake.customer.contact),
    customerName: intake.customer.name || undefined,
    customerPhone: intake.customer.contact || undefined,
  };
}

export function structuredIntakeToIntakeState(
  intake: StructuredIntake,
  intakeComplete: boolean,
  existing?: IntakeState
): IntakeState {
  const severity = parseSeverity(intake.issue.severity || intake.aiEstimate.urgencyLevel);
  const range = intake.aiEstimate.estimatedPriceRange;
  const lowHigh = parsePriceRange(range);

  return {
    phase: intakeComplete ? "complete" : existing?.phase ?? "symptom_capture",
    symptomSummary:
      intake.issue.symptoms.join("; ") || (existing?.symptomSummary ?? ""),
    clarificationNotes: existing?.clarificationNotes ?? [],
    clarifyAsked: existing?.clarifyAsked ?? false,
    possibleCauses: intake.aiEstimate.possibleCauses.length
      ? intake.aiEstimate.possibleCauses
      : existing?.possibleCauses ?? [],
    estimateLow: lowHigh.low,
    estimateHigh: lowHigh.high,
    severity,
    callbackRequested: Boolean(intake.customer.contact),
    leadCaptured: existing?.leadCaptured ?? false,
    category: existing?.category,
  };
}

function parsePriceRange(range: string): { low: number; high: number } {
  const nums = range.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length >= 2) return { low: Math.min(nums[0], nums[1]), high: Math.max(nums[0], nums[1]) };
  if (nums.length === 1) return { low: nums[0], high: Math.round(nums[0] * 1.5) };
  return { low: 60, high: 350 };
}

export function isStructuredIntakeReadyForHandoff(intake: StructuredIntake): boolean {
  const hasContact = Boolean(intake.customer.name.trim() && intake.customer.contact.trim());
  const hasSymptoms = intake.issue.symptoms.length > 0;
  const hasVehicle =
    Boolean(intake.vehicle.make.trim() || intake.vehicle.model.trim()) ||
    Boolean(intake.vehicle.year.trim());
  return hasContact && hasSymptoms && hasVehicle;
}

export function bookingContextLine(ctx?: BookingChatContext): string {
  if (!ctx) return "";
  return `Booking context: ${ctx.service} on ${ctx.preferredDate} at ${ctx.preferredTime}.`;
}
