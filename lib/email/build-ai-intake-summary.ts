import type { ChatSession } from "@/lib/types/chat";
import type {
  AiIntakeWorkshopSummary,
  IntakeDrivability,
  IntakeIntent,
} from "@/lib/types/ai-intake";
import type { SymptomCategory } from "@/lib/types/intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import { uploadService } from "@/lib/services/upload.service";
import { sanitizePlainText } from "@/lib/utils/sanitize";

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

function parseUrgency(draft?: string, severity?: string): UrgencyLevel {
  const u = (draft ?? "").toLowerCase();
  if (/urgent|stranded|asap|emergency|high/.test(u)) return "high";
  if (/soon|week|attention|medium/.test(u)) return "medium";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

function buildObservations(intake: ChatSession["intakeState"]): string[] {
  if (!intake) return [];
  const notes: string[] = [];
  if (intake.category) {
    notes.push(`Category: ${CATEGORY_SERVICE[intake.category] ?? intake.category}`);
  }
  if (intake.severity) notes.push(`Severity level: ${intake.severity}`);
  if (intake.callbackRequested) notes.push("Customer requested technician callback");
  return notes;
}

function resolveDrivability(structured?: StructuredIntake): {
  status: IntakeDrivability;
  note?: string;
} {
  if (!structured) return { status: "unknown" };
  const d = structured.issue.drivable;
  const severity = (structured.issue.severity || structured.aiEstimate.urgencyLevel).toLowerCase();
  const next = structured.aiEstimate.recommendedNextStep ?? "";

  if (/won.?t start|will not start|not starting|stranded/i.test(next + " " + structured.issue.symptoms.join(" "))) {
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

export function buildAiIntakeWorkshopSummary(
  session: ChatSession,
  opts?: { uploadIds?: string[]; customerEmail?: string }
): AiIntakeWorkshopSummary {
  const draft = session.leadDraft ?? {};
  const mechanic = session.mechanicSummary;
  const intake = session.intakeState;
  const structured = session.structuredIntake;
  const uploads = uploadService.getByIds(opts?.uploadIds ?? []);

  const customerName = sanitizePlainText(
    draft.name || structured?.customer.name || mechanic?.customerName || "",
    80
  );
  const customerPhone = sanitizePlainText(
    draft.phone || structured?.customer.contact || mechanic?.customerPhone || "",
    32
  );

  const registration = sanitizePlainText(
    draft.registration || mechanic?.registration || "",
    16
  ).toUpperCase();

  const serviceRequested = session.bookingContext
    ? session.bookingContext.service
    : intake?.category
      ? CATEGORY_SERVICE[intake.category]
      : "General advisory";

  const formatRange =
    mechanic?.estimatedRange ??
    (structured?.aiEstimate.estimatedPriceRange ||
      (intake && (intake.estimateLow || intake.estimateHigh)
        ? `£${intake.estimateLow}–£${intake.estimateHigh}`
        : undefined));

  const structuredVehicle = structured
    ? [structured.vehicle.year, structured.vehicle.make, structured.vehicle.model]
        .filter(Boolean)
        .join(" ")
    : "";

  const symptoms = sanitizePlainText(
    mechanic?.symptoms ??
      structured?.issue.symptoms.join("; ") ??
      draft.problemDescription ??
      intake?.symptomSummary ??
      "",
    2000
  );

  const warningLights = (structured?.issue.warningLights ?? []).map((l) =>
    sanitizePlainText(l, 60)
  );
  const drivability = resolveDrivability(structured);
  const intent = resolveIntent(structured, session);

  const aiSummary = sanitizePlainText(
    structured?.aiEstimate.summary ||
      structured?.aiEstimate.recommendedNextStep ||
      mechanic?.severityNote ||
      "",
    600
  );

  const preferredBookingTime =
    sanitizePlainText(structured?.preferredBookingTime, 120) || undefined;

  const missingFields: string[] = [];
  if (!customerName) missingFields.push("customer name");
  if (!customerPhone) missingFields.push("phone number");
  if (!registration) missingFields.push("registration");
  if (!symptoms) missingFields.push("issue description");
  const partial = missingFields.length > 0;

  return {
    customerName: customerName || "Not provided",
    customerPhone: customerPhone || "Not provided",
    customerEmail: opts?.customerEmail
      ? sanitizePlainText(opts.customerEmail, 254)
      : draft.email
        ? sanitizePlainText(draft.email, 254)
        : undefined,
    registration: registration || "TBC",
    vehicle:
      sanitizePlainText(draft.vehicleModel ?? structuredVehicle ?? mechanic?.vehicle, 80) ||
      undefined,
    serviceRequested: sanitizePlainText(serviceRequested, 120),
    symptoms: symptoms || "Not specified — see transcript",
    warningLights,
    drivability: drivability.status,
    drivabilityNote: drivability.note ? sanitizePlainText(drivability.note, 300) : undefined,
    possibleCauses: (
      mechanic?.possibleCauses ??
      structured?.aiEstimate.possibleCauses ??
      intake?.possibleCauses ??
      []
    ).map((c) => sanitizePlainText(c, 200)),
    estimatedRange: formatRange ? sanitizePlainText(formatRange, 80) : undefined,
    urgency: parseUrgency(
      draft.urgency ?? structured?.aiEstimate.urgencyLevel,
      mechanic?.severity ?? intake?.severity
    ),
    severity: mechanic?.severity ?? intake?.severity,
    severityNote: sanitizePlainText(mechanic?.severityNote, 500) || undefined,
    observations: buildObservations(intake),
    category: intake?.category,
    clarificationNotes: (intake?.clarificationNotes ?? []).map((n) =>
      sanitizePlainText(n, 200)
    ),
    aiSummary,
    intent,
    preferredBookingTime,
    callbackAvailability: sanitizePlainText(
      draft.callbackWindow ?? mechanic?.callbackWindow,
      120
    ) || undefined,
    callbackRequested:
      mechanic?.callbackRequested ?? intake?.callbackRequested ?? false,
    bookingPreference: session.bookingContext
      ? {
          service: session.bookingContext.service,
          preferredDate: session.bookingContext.preferredDate,
          preferredTime: session.bookingContext.preferredTime,
        }
      : undefined,
    uploadedFiles: uploads.map((u) => ({
      id: u.id,
      fileName: u.fileName,
      mimeType: u.mimeType,
      category: u.category,
    })),
    transcript: [...session.messages],
    chatSessionId: session.id,
    preparedAt: new Date().toISOString(),
    partial,
    missingFields,
  };
}
