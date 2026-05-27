import { chatRepository } from "@/lib/repositories/chat.repository";
import { sendBookingIntakeEmail } from "@/lib/email/send-workshop-intake";
import { bookingService } from "@/lib/services/booking.service";
import { uploadService } from "@/lib/services/upload.service";
import type {
  CompleteBookingIntakeInput,
  CompleteBookingIntakeResult,
  ServiceIntakeSummary,
  UrgencyLevel,
} from "@/lib/types/service-intake";

function parseUrgency(draft?: string, severity?: string): UrgencyLevel {
  const u = (draft ?? "").toLowerCase();
  if (/urgent|stranded|asap|emergency|high/.test(u)) return "high";
  if (/soon|week|attention|medium/.test(u)) return "medium";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

export const bookingIntakeService = {
  async complete(
    input: CompleteBookingIntakeInput
  ): Promise<CompleteBookingIntakeResult> {
    const session = chatRepository.findById(input.chatSessionId);
    if (!session) {
      throw new Error("Intake session not found");
    }

    const draft = session.leadDraft;
    const mechanic = session.mechanicSummary;
    const intake = session.intakeState;

    if (!draft?.name || !draft?.phone) {
      throw new Error("Complete the service advisor conversation before submitting");
    }

    const registration =
      input.registration?.trim() ||
      draft.registration?.trim() ||
      "TBC";

    const uploads = uploadService.getByIds(input.uploadIds ?? []);

    const summary: ServiceIntakeSummary = {
      customerName: draft.name,
      customerPhone: draft.phone,
      registration: registration.toUpperCase(),
      vehicle: draft.vehicleModel,
      bookingSlot: {
        service: input.service,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
      },
      symptoms:
        mechanic?.symptoms ??
        draft.problemDescription ??
        intake?.symptomSummary ??
        "Not specified",
      possibleCauses: mechanic?.possibleCauses ?? intake?.possibleCauses ?? [],
      estimatedRange: mechanic?.estimatedRange,
      uploadedFiles: uploads.map((u) => ({
        id: u.id,
        fileName: u.fileName,
        mimeType: u.mimeType,
        category: u.category,
      })),
      callbackAvailability: draft.callbackWindow,
      urgency: parseUrgency(draft.urgency, mechanic?.severity ?? intake?.severity),
      severity: mechanic?.severity ?? intake?.severity,
      severityNote: mechanic?.severityNote,
      chatSessionId: session.id,
      preparedAt: new Date().toISOString(),
    };

    const notes = [
      `Symptoms: ${summary.symptoms}`,
      summary.possibleCauses.length
        ? `Possible causes: ${summary.possibleCauses.join(", ")}`
        : null,
      summary.estimatedRange ? `Indicative: ${summary.estimatedRange}` : null,
      `Urgency: ${summary.urgency}`,
      summary.callbackAvailability
        ? `Callback: ${summary.callbackAvailability}`
        : null,
      uploads.length ? `Attachments: ${uploads.length} file(s)` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // suppressWorkshopEmail: true — this service sends its own richer
    // notification (sendBookingIntakeEmail below) that includes the full
    // conversation transcript. Customer confirmation still fires from
    // bookingService if customerEmail is present on the booking.
    const booking = await bookingService.create(
      {
        service: input.service,
        registration: summary.registration,
        vehicleModel: summary.vehicle,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        duration: "1h",
        customerName: summary.customerName,
        customerPhone: summary.customerPhone,
        notes,
        source: "website",
        intakeSummary: summary,
        uploadIds: uploads.map((u) => u.id),
      },
      { suppressWorkshopEmail: true }
    );

    if (session.intakeEmailedAt) {
      throw new Error("This intake was already sent to the workshop");
    }

    const sent = await sendBookingIntakeEmail(summary, {
      bookingId: booking.id,
      transcript: session.messages,
    });

    chatRepository.markIntakeEmailed(session.id, sent.id);

    return {
      bookingId: booking.id,
      intakeSummary: summary,
      emailPrepared: true,
      emailSent: true,
      emailId: sent.id,
    };
  },
};
