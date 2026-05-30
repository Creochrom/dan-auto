import type { ChatSession } from "@/lib/types/chat";
import type { IntakeDrivability, IntakeIntent } from "@/lib/types/ai-intake";
import type { SymptomCategory } from "@/lib/types/intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
import { createEmptyStructuredIntake, type StructuredIntake } from "@/lib/types/structured-intake";
import type { WorkshopCaseKind, WorkshopCaseSummary } from "@/lib/types/workshop-case-summary";
import {
  extractCustomerConcernFromTranscript,
  resolveCallbackSlotFields,
} from "@/lib/services/callback-intake";
import {
  buildMechanicCaseSummary,
  detectRecoveryContext,
  inferIssueTitle,
  resolveWorkshopCaseKind,
} from "@/lib/intake/unified-intake";
import {
  detectPrimarySymptom,
  inferDiagnosticConfidence,
  primarySymptomLabel,
} from "@/lib/diagnostic/investigation-trees";
import { inferBookingService, dedupeServiceLabel } from "@/lib/services/booking-handoff";
import { sanitizePlainText } from "@/lib/utils/sanitize";
import {
  formatVehicleDisplay,
  formatVehicleFromLegacyString,
  vehiclePartsFromStructured,
} from "@/lib/vehicle/format-vehicle-display";

const PLACEHOLDER_SYMPTOM =
  /^(not specified|see chat transcript|see customer messages|see transcript)/i;

const CATEGORY_SERVICE: Record<SymptomCategory, string> = {
  brakes: "Brakes",
  suspension: "Suspension",
  engine_warning: "Diagnostics / warning lights",
  mot: "MOT",
  battery: "Battery / electrical",
  dpf: "DPF / emissions",
  overheating: "Cooling / overheating",
  noise: "Noise diagnosis",
  steering: "Steering / alignment",
  starting: "Starting / immobiliser",
  general: "General repair",
};

export type BuildWorkshopCaseOptions = {
  kind?: WorkshopCaseKind;
  uploadIds?: string[];
  customerEmail?: string;
  /** Workflow mode when building from an in-progress chat (no submit yet). */
  workflowMode?: import("@/lib/services/advisor-workflow").WorkflowMode;
  /** Booking handoff — explicit slot + service from client payload. */
  booking?: {
    service: string;
    preferredDate: string;
    preferredTime: string;
    registration?: string;
  };
};

function parseUrgency(draft?: string, severity?: string): UrgencyLevel {
  const u = (draft ?? "").toLowerCase();
  if (/urgent|stranded|asap|emergency|high/.test(u)) return "high";
  if (/soon|week|attention|medium/.test(u)) return "medium";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

function resolveDrivability(structured?: StructuredIntake): {
  status: IntakeDrivability;
  note?: string;
} {
  if (!structured) return { status: "unknown" };
  const d = structured.issue.drivable;
  const severity = (structured.issue.severity || structured.aiEstimate.urgencyLevel).toLowerCase();
  const next = structured.aiEstimate.recommendedNextStep ?? "";

  if (
    /won.?t start|will not start|not starting|stranded/i.test(
      `${next} ${structured.issue.symptoms.join(" ")}`
    )
  ) {
    return { status: "will_not_start", note: next || undefined };
  }
  if (d === false || /avoid driving|do not drive|recovery/i.test(next)) {
    return { status: "avoid_driving", note: next || undefined };
  }
  if (d === true && severity === "high") {
    return { status: "drivable_with_concern", note: next || undefined };
  }
  if (d === true) return { status: "drives_normally", note: next || undefined };
  return { status: "unknown" };
}

function resolveIntent(structured?: StructuredIntake, session?: ChatSession): IntakeIntent {
  if (session?.bookingContext) return "book";
  const raw = (structured?.intent ?? "").toLowerCase();
  if (raw === "book" || raw === "callback" || raw === "quote" || raw === "info_only") {
    return raw;
  }
  if (structured?.customer.name && structured.customer.contact) return "callback";
  return "unspecified";
}

function isUsableSymptom(value?: string | null): value is string {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_SYMPTOM.test(trimmed);
}

/** Resolve symptoms — structuredIntake first, then legacy, never placeholder when structured exists. */
export function resolveCaseSymptoms(session: ChatSession): string {
  const structured = session.structuredIntake;
  const draft = session.leadDraft ?? {};
  const mechanic = session.mechanicSummary;
  const intake = session.intakeState;

  const structuredSymptoms = structured?.issue.symptoms
    .map((s) => s.trim())
    .filter(Boolean)
    .join("; ");

  if (structuredSymptoms) {
    return sanitizePlainText(structuredSymptoms, 2000);
  }

  const candidates = [
    draft.problemDescription,
    isUsableSymptom(mechanic?.symptoms) ? mechanic?.symptoms : undefined,
    intake?.symptomSummary,
    extractCustomerConcernFromTranscript(session.messages),
  ];

  for (const candidate of candidates) {
    if (isUsableSymptom(candidate)) {
      return sanitizePlainText(candidate, 2000);
    }
  }

  return "";
}

function resolveServiceLabel(session: ChatSession, structured?: StructuredIntake): string {
  if (session.bookingContext?.service) {
    return dedupeServiceLabel(session.bookingContext.service);
  }
  if (session.intakeState?.category) {
    return CATEGORY_SERVICE[session.intakeState.category] ?? "General repair";
  }
  if (structured) {
    return dedupeServiceLabel(inferBookingService(structured, session.leadDraft ?? {}));
  }
  return "General advisory";
}

function resolveCallbackReason(
  kind: WorkshopCaseKind,
  structured: StructuredIntake | undefined,
  serviceLabel: string,
  symptoms: string
): string | undefined {
  if (kind !== "callback") return undefined;

  const summary = structured?.aiEstimate.summary?.trim();
  if (summary && summary.length >= 12 && !PLACEHOLDER_SYMPTOM.test(summary)) {
    return sanitizePlainText(summary, 400);
  }

  const recommended = structured?.aiEstimate.recommendedNextStep?.trim();
  if (
    recommended &&
    /callback|call (?:the )?customer|phone|pricing|quote|discuss/i.test(recommended)
  ) {
    return sanitizePlainText(recommended, 400);
  }

  const subject = serviceLabel !== "General advisory" ? serviceLabel.toLowerCase() : "";
  if (subject && symptoms) {
    return `Customer requested a callback regarding ${subject} — ${sanitizePlainText(symptoms, 120)}.`;
  }
  if (subject) {
    return `Customer requested a callback regarding ${subject}.`;
  }
  if (symptoms) {
    return `Customer requested a callback regarding: ${sanitizePlainText(symptoms, 160)}.`;
  }
  return "Customer requested a mechanic phone callback.";
}

function formatVehicleLine(structured?: StructuredIntake, draftModel?: string, mechanicVehicle?: string): string | undefined {
  const structuredVehicle = structured
    ? formatVehicleDisplay(vehiclePartsFromStructured(structured))
    : "";
  const draftFormatted = formatVehicleFromLegacyString(draftModel);
  const line = draftFormatted ?? structuredVehicle ?? formatVehicleFromLegacyString(mechanicVehicle) ?? mechanicVehicle;
  return line ? sanitizePlainText(line, 80) : undefined;
}

export function buildWorkshopCaseSummary(
  session: ChatSession,
  opts: BuildWorkshopCaseOptions
): WorkshopCaseSummary {
  const draft = session.leadDraft ?? {};
  const mechanic = session.mechanicSummary;
  const intake = session.intakeState;
  const structured = session.structuredIntake;

  const customerName = sanitizePlainText(
    draft.name || structured?.customer.name || mechanic?.customerName || "",
    80
  );
  const customerPhone = sanitizePlainText(
    draft.phone || structured?.customer.contact || mechanic?.customerPhone || "",
    32
  );

  const registration = sanitizePlainText(
    opts.booking?.registration?.trim() ||
      draft.registration ||
      mechanic?.registration ||
      "",
    16
  ).toUpperCase();

  const symptoms = resolveCaseSymptoms(session);
  const serviceLabel = opts.booking?.service ?? resolveServiceLabel(session, structured);
  const intent = resolveIntent(structured, session);
  const drivability = resolveDrivability(structured);
  const recovery = structured
    ? detectRecoveryContext(structured, session.messages, draft)
    : { needed: false };

  const kind =
    opts.kind ??
    resolveWorkshopCaseKind(
      opts.workflowMode ?? (session.bookingContext ? "booking" : "callback"),
      structured ?? createEmptyStructuredIntake(),
      session.messages,
      draft
    );

  const formatRange =
    mechanic?.estimatedRange ??
    (structured?.aiEstimate.estimatedPriceRange ||
      (intake && (intake.estimateLow || intake.estimateHigh)
        ? `£${intake.estimateLow}–£${intake.estimateHigh}`
        : undefined));

  const preferredBookingTime =
    sanitizePlainText(structured?.preferredBookingTime, 120) || undefined;

  const callbackSlot = resolveCallbackSlotFields(preferredBookingTime, draft);

  const preferredDate =
    kind === "booking"
      ? opts.booking?.preferredDate ?? session.bookingContext?.preferredDate
      : callbackSlot.preferredDate;

  const preferredTime =
    kind === "booking"
      ? opts.booking?.preferredTime ?? session.bookingContext?.preferredTime
      : callbackSlot.preferredTime;

  const mechanicSummaryText = structured
    ? buildMechanicCaseSummary({
        mode: opts.workflowMode ?? (kind === "booking" ? "booking" : "callback"),
        intake: structured,
        leadDraft: draft,
        messages: session.messages,
      })
    : "";

  const recommendedAction = sanitizePlainText(
    structured?.aiEstimate.recommendedNextStep ||
      mechanic?.severityNote ||
      mechanicSummaryText.split("\n").find((l) => l.startsWith("Recommended action:"))?.replace(/^Recommended action:\s*/, "") ||
      "",
    500
  );

  const possibleCauses = (
    mechanic?.possibleCauses ??
    structured?.aiEstimate.possibleCauses ??
    intake?.possibleCauses ??
    []
  )
    .map((c) => sanitizePlainText(c, 200))
    .filter(Boolean);

  const warningLights = (structured?.issue.warningLights ?? [])
    .map((l) => sanitizePlainText(l, 60))
    .filter(Boolean);

  const primarySymptom = structured
    ? sanitizePlainText(
        structured.issue.primarySymptom?.trim() ||
          primarySymptomLabel(detectPrimarySymptom(structured, session.messages)),
        80
      )
    : undefined;

  const drivingSymptomsText = (structured?.issue.drivingSymptoms ?? [])
    .map((s) => sanitizePlainText(s, 120))
    .filter(Boolean)
    .join("; ");

  const confidenceLevel = structured
    ? inferDiagnosticConfidence(structured)
    : undefined;

  const vehicleEngine = structured?.vehicle.engine?.trim()
    ? sanitizePlainText(structured.vehicle.engine, 60)
    : undefined;

  return {
    kind,
    customerName,
    customerPhone,
    customerEmail: opts.customerEmail
      ? sanitizePlainText(opts.customerEmail, 254)
      : draft.email
        ? sanitizePlainText(draft.email, 254)
        : undefined,
    registration: registration || "TBC",
    vehicle: formatVehicleLine(structured, draft.vehicleModel, mechanic?.vehicle),
    vehicleEngine,
    primarySymptom: primarySymptom || undefined,
    issueTitle: structured ? inferIssueTitle(structured) : undefined,
    timeline: structured?.issue.startedWhen.trim()
      ? sanitizePlainText(structured.issue.startedWhen, 120)
      : undefined,
    severity: structured?.issue.severity.trim()
      ? sanitizePlainText(structured.issue.severity, 40)
      : undefined,
    symptoms,
    drivingSymptoms: drivingSymptomsText || undefined,
    requestedAction:
      kind === "booking"
        ? sanitizePlainText(serviceLabel, 120)
        : kind === "recovery"
          ? "Recovery / collection"
          : undefined,
    customerObjective:
      kind === "callback"
        ? resolveCallbackReason(kind, structured, serviceLabel, symptoms)
        : undefined,
    collectionAddress: recovery.collectionAddress,
    collectionDistance: recovery.collectionDistance,
    collectionPreferredWindow: recovery.collectionPreferredWindow,
    callbackReason:
      kind === "callback"
        ? resolveCallbackReason(kind, structured, serviceLabel, symptoms)
        : undefined,
    bookingReason: kind === "booking" ? sanitizePlainText(serviceLabel, 120) : undefined,
    estimatedRange: formatRange ? sanitizePlainText(formatRange, 80) : undefined,
    urgency: parseUrgency(
      draft.urgency ?? structured?.aiEstimate.urgencyLevel,
      mechanic?.severity ?? intake?.severity
    ),
    drivability: drivability.status,
    drivabilityNote: drivability.note ? sanitizePlainText(drivability.note, 300) : undefined,
    preferredDate: preferredDate || undefined,
    preferredTime: preferredTime || undefined,
    recommendedAction: recommendedAction || undefined,
    possibleCauses: possibleCauses.length ? possibleCauses : undefined,
    confidenceLevel: confidenceLevel && confidenceLevel !== "low" ? confidenceLevel : undefined,
    warningLights: warningLights.length ? warningLights : undefined,
    intent,
    chatSessionId: session.id,
    preparedAt: new Date().toISOString(),
  };
}
