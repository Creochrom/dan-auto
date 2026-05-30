import type { BookingChatContext, LeadDraft } from "@/lib/types/chat";
import type { IntakeSeverity, IntakeState, MechanicIntakeSummary } from "@/lib/types/intake";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";
import {
  createEmptyStructuredIntake,
  type StructuredIntake,
} from "@/lib/types/structured-intake";
import {
  validateCustomerName,
  validateCustomerPhone,
  validateLeadContact,
} from "@/lib/validation/advisor-contact";
import {
  formatVehicleDisplay,
  normalizeVehicleParts,
} from "@/lib/vehicle/format-vehicle-display";

/** DVLA-backed vehicle fields that Gemini must not overwrite. */
export type LockedVehicleFacts = Partial<
  Pick<StructuredIntake["vehicle"], "make" | "model" | "year" | "engine">
>;

export function resolveDvlaVehicleFacts(opts: {
  vehicleMemory?: VehicleMemoryLookupResult;
  advisorRoute?: AdvisorRouteContext;
}): LockedVehicleFacts | undefined {
  const memoryVehicle =
    opts.vehicleMemory?.dvlaMatched && opts.vehicleMemory.vehicle
      ? opts.vehicleMemory.vehicle
      : undefined;
  const routeVehicle = opts.advisorRoute?.vehicle_data;

  const source = memoryVehicle ?? routeVehicle;
  if (!source) return undefined;

  const locked: LockedVehicleFacts = {};
  if (source.make?.trim()) locked.make = source.make.trim();
  if (source.model?.trim()) locked.model = source.model.trim();
  if (source.year?.trim()) locked.year = source.year.trim();
  if (source.engine?.trim()) locked.engine = source.engine.trim();

  return Object.keys(locked).length > 0 ? locked : undefined;
}

export function applyLockedVehicleFacts(
  intake: StructuredIntake,
  locked?: LockedVehicleFacts
): StructuredIntake {
  if (!locked) return intake;
  return {
    ...intake,
    vehicle: {
      ...intake.vehicle,
      make: locked.make ?? intake.vehicle.make,
      model: locked.model ?? intake.vehicle.model,
      year: locked.year ?? intake.vehicle.year,
      engine: locked.engine ?? intake.vehicle.engine,
    },
  };
}

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
  incoming: Partial<StructuredIntake> | undefined,
  lockedVehicle?: LockedVehicleFacts
): StructuredIntake {
  const base = current ?? createEmptyStructuredIntake();
  if (!incoming) return applyLockedVehicleFacts(base, lockedVehicle);

  const merged: StructuredIntake = {
    customer: {
      name: pickContactField(incoming.customer?.name, base.customer.name, "name"),
      contact: pickContactField(incoming.customer?.contact, base.customer.contact, "phone"),
    },
    vehicle: {
      make: pickString(incoming.vehicle?.make, base.vehicle.make),
      model: pickString(incoming.vehicle?.model, base.vehicle.model),
      year: pickString(incoming.vehicle?.year, base.vehicle.year),
      engine: pickString(incoming.vehicle?.engine, base.vehicle.engine),
      mileage: pickString(incoming.vehicle?.mileage, base.vehicle.mileage),
    },
    issue: {
      primarySymptom: pickString(incoming.issue?.primarySymptom, base.issue.primarySymptom ?? ""),
      symptoms: incoming.issue?.symptoms?.length
        ? incoming.issue.symptoms
        : base.issue.symptoms,
      drivingSymptoms: incoming.issue?.drivingSymptoms?.length
        ? incoming.issue.drivingSymptoms
        : base.issue.drivingSymptoms ?? [],
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
      diagnosticConfidence: pickString(
        incoming.aiEstimate?.diagnosticConfidence,
        base.aiEstimate.diagnosticConfidence
      ) as StructuredIntake["aiEstimate"]["diagnosticConfidence"],
      summary: pickString(incoming.aiEstimate?.summary, base.aiEstimate.summary),
    },
    intent: incoming.intent && incoming.intent.trim() ? incoming.intent : base.intent,
    preferredBookingTime: pickString(
      incoming.preferredBookingTime,
      base.preferredBookingTime
    ),
  };

  return applyLockedVehicleFacts(merged, lockedVehicle);
}

function pickString(
  incoming: string | undefined | null,
  base: string
): string {
  if (typeof incoming === "string" && incoming.trim().length > 0) return incoming;
  return base;
}

/** Only accept validated contact values — never merge placeholder text from the model. */
function pickContactField(
  incoming: string | undefined | null,
  base: string,
  kind: "name" | "phone"
): string {
  const trimmed = typeof incoming === "string" ? incoming.trim() : "";
  if (!trimmed) return base;

  if (kind === "name") {
    const parsed = validateCustomerName(trimmed);
    return parsed.valid ? parsed.normalized : base;
  }

  const parsed = validateCustomerPhone(trimmed);
  return parsed.valid ? parsed.normalized : base;
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
  const vehicleParts = formatVehicleDisplay(normalizeVehicleParts(intake.vehicle));

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

  const vehicle = formatVehicleDisplay(normalizeVehicleParts(intake.vehicle));

  return {
    vehicle: vehicle || undefined,
    registration: registrationHint,
    symptoms: symptoms || "",
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
  const contact = validateLeadContact(intake.customer.name, intake.customer.contact);
  const hasSymptoms = intake.issue.symptoms.length > 0;
  const hasVehicle =
    Boolean(intake.vehicle.make.trim() || intake.vehicle.model.trim()) ||
    Boolean(intake.vehicle.year.trim());
  return contact.canSubmit && hasSymptoms && hasVehicle;
}

export function bookingContextLine(ctx?: BookingChatContext): string {
  if (!ctx) return "";
  return `Booking context: ${ctx.service} on ${ctx.preferredDate} at ${ctx.preferredTime}.`;
}
