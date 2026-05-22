import type { ChatSession } from "@/lib/types/chat";
import type { AiIntakeWorkshopSummary } from "@/lib/types/ai-intake";
import type { SymptomCategory } from "@/lib/types/intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
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

export function buildAiIntakeWorkshopSummary(
  session: ChatSession,
  opts?: { uploadIds?: string[]; customerEmail?: string }
): AiIntakeWorkshopSummary {
  const draft = session.leadDraft ?? {};
  const mechanic = session.mechanicSummary;
  const intake = session.intakeState;
  const uploads = uploadService.getByIds(opts?.uploadIds ?? []);

  const registration = sanitizePlainText(
    draft.registration ?? mechanic?.registration ?? "TBC",
    16
  ).toUpperCase();

  const serviceRequested = session.bookingContext
    ? session.bookingContext.service
    : intake?.category
      ? CATEGORY_SERVICE[intake.category]
      : "General advisory";

  const formatRange =
    mechanic?.estimatedRange ??
    (intake
      ? `£${intake.estimateLow}–£${intake.estimateHigh}`
      : undefined);

  return {
    customerName: sanitizePlainText(draft.name ?? mechanic?.customerName ?? "Unknown", 80),
    customerPhone: sanitizePlainText(draft.phone ?? mechanic?.customerPhone ?? "", 32),
    customerEmail: opts?.customerEmail
      ? sanitizePlainText(opts.customerEmail, 254)
      : draft.email
        ? sanitizePlainText(draft.email, 254)
        : undefined,
    registration,
    vehicle: sanitizePlainText(draft.vehicleModel ?? mechanic?.vehicle, 80) || undefined,
    serviceRequested: sanitizePlainText(serviceRequested, 120),
    symptoms: sanitizePlainText(
      mechanic?.symptoms ??
        draft.problemDescription ??
        intake?.symptomSummary ??
        "Not specified",
      2000
    ),
    possibleCauses: (mechanic?.possibleCauses ?? intake?.possibleCauses ?? []).map((c) =>
      sanitizePlainText(c, 200)
    ),
    estimatedRange: formatRange ? sanitizePlainText(formatRange, 80) : undefined,
    urgency: parseUrgency(draft.urgency, mechanic?.severity ?? intake?.severity),
    severity: mechanic?.severity ?? intake?.severity,
    severityNote: sanitizePlainText(mechanic?.severityNote, 500) || undefined,
    observations: buildObservations(intake),
    category: intake?.category,
    clarificationNotes: (intake?.clarificationNotes ?? []).map((n) =>
      sanitizePlainText(n, 200)
    ),
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
  };
}
