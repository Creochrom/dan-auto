import type { ChatSession } from "@/lib/types/chat";
import type {
  AiIntakeWorkshopSummary,
  IntakeDrivability,
  IntakeIntent,
} from "@/lib/types/ai-intake";
import type { SymptomCategory } from "@/lib/types/intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
import { uploadService } from "@/lib/services/upload.service";
import { resolveWorkshopCaseKind } from "@/lib/intake/unified-intake";
import { buildCallbackSummary } from "@/lib/services/callback-intake";
import { buildWorkshopCaseSummary } from "@/lib/workshop/build-workshop-case-summary";
import { createEmptyStructuredIntake } from "@/lib/types/structured-intake";
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

export async function buildAiIntakeWorkshopSummary(
  session: ChatSession,
  opts?: { uploadIds?: string[]; customerEmail?: string }
): Promise<AiIntakeWorkshopSummary> {
  const intake = session.intakeState;
  const uploads = await uploadService.getByIds(opts?.uploadIds ?? []);
  const rawIntent = session.structuredIntake?.intent;
  const workflowMode = session.bookingContext
    ? "booking"
    : rawIntent === "quote"
      ? "pricing"
      : rawIntent === "callback"
        ? "callback"
        : "diagnostic";

  const caseSummary = buildWorkshopCaseSummary(session, {
    workflowMode,
    uploadIds: opts?.uploadIds,
    customerEmail: opts?.customerEmail,
    kind: session.bookingContext
      ? "booking"
      : resolveWorkshopCaseKind(
          workflowMode,
          session.structuredIntake ?? createEmptyStructuredIntake(),
          session.messages,
          session.leadDraft ?? {}
        ),
    booking: session.bookingContext
      ? {
          service: session.bookingContext.service,
          preferredDate: session.bookingContext.preferredDate,
          preferredTime: session.bookingContext.preferredTime,
        }
      : undefined,
  });

  const serviceRequested = session.bookingContext
    ? session.bookingContext.service
    : intake?.category
      ? CATEGORY_SERVICE[intake.category]
      : caseSummary.bookingReason ?? "General advisory";

  const callbackSummary = buildCallbackSummary({
    symptoms: caseSummary.symptoms,
    estimatedRange: caseSummary.estimatedRange,
    aiSummary: caseSummary.callbackReason,
    intent: (caseSummary.intent ?? "callback") as IntakeIntent,
    urgency: caseSummary.urgency,
    possibleCauses: caseSummary.possibleCauses ?? [],
    callbackReason: caseSummary.callbackReason,
  });

  const missingFields: string[] = [];
  if (!caseSummary.customerName) missingFields.push("customer name");
  if (!caseSummary.customerPhone) missingFields.push("phone number");
  if (!caseSummary.registration || caseSummary.registration === "TBC") {
    missingFields.push("registration");
  }
  if (!caseSummary.symptoms) missingFields.push("issue description");
  const partial = missingFields.length > 0;

  return {
    caseSummary,
    customerName: caseSummary.customerName || "Not provided",
    customerPhone: caseSummary.customerPhone || "Not provided",
    customerEmail: caseSummary.customerEmail,
    registration: caseSummary.registration || "TBC",
    vehicle: caseSummary.vehicle,
    vehicleEngine: caseSummary.vehicleEngine,
    serviceRequested: sanitizePlainText(serviceRequested, 120),
    symptoms: caseSummary.symptoms,
    warningLights: caseSummary.warningLights ?? [],
    drivability: caseSummary.drivability as IntakeDrivability,
    drivabilityNote: caseSummary.drivabilityNote,
    possibleCauses: caseSummary.possibleCauses ?? [],
    estimatedRange: caseSummary.estimatedRange,
    urgency: caseSummary.urgency as UrgencyLevel,
    severity: intake?.severity,
    severityNote: caseSummary.recommendedAction,
    observations: buildObservations(intake),
    category: intake?.category,
    clarificationNotes: (intake?.clarificationNotes ?? []).map((n) =>
      sanitizePlainText(n, 200)
    ),
    aiSummary:
      session.structuredIntake?.aiEstimate.summary ??
      caseSummary.callbackReason ??
      caseSummary.recommendedAction ??
      "",
    intent: (caseSummary.intent ?? "unspecified") as IntakeIntent,
    preferredBookingTime: session.structuredIntake?.preferredBookingTime,
    callbackAvailability: caseSummary.preferredTime,
    callbackPreferredDate: caseSummary.preferredDate,
    callbackPreferredTime: caseSummary.preferredTime,
    callbackReason: caseSummary.callbackReason,
    callbackSummary,
    callbackRequested: caseSummary.kind === "callback",
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
    preparedAt: caseSummary.preparedAt,
    partial,
    missingFields,
  };
}
