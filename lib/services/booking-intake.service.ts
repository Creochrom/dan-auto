import { chatRepository } from "@/lib/repositories/chat.repository";
import { bookingService } from "@/lib/services/booking.service";
import { uploadService } from "@/lib/services/upload.service";
import { validateLeadContact } from "@/lib/validation/advisor-contact";
import { buildWorkshopCaseSummary } from "@/lib/workshop/build-workshop-case-summary";
import { bookingTraceEnd, bookingTraceStage } from "@/lib/logging/booking-trace";
import { dedupeServiceLabel, normalizePreferredWindow } from "@/lib/services/booking-handoff";
import { getStorageBackend } from "@/lib/repositories/backend";
import type {
  CompleteBookingIntakeInput,
  CompleteBookingIntakeResult,
  ServiceIntakeSummary,
} from "@/lib/types/service-intake";

export const bookingIntakeService = {
  async complete(
    input: CompleteBookingIntakeInput
  ): Promise<CompleteBookingIntakeResult> {
    const traceId = input.traceId ?? `btrace_svc_${Date.now()}`;

    bookingTraceStage("6_booking_intake_service", traceId, {
      chatSessionId: input.chatSessionId,
      service: input.service,
      storageBackend: getStorageBackend(),
    });

    const session = await chatRepository.findById(input.chatSessionId);
    if (!session) {
      bookingTraceEnd(traceId, "failure", {
        stage: "6_booking_intake_service",
        reason: "intake_session_not_found",
        chatSessionId: input.chatSessionId,
      });
      throw new Error("Intake session not found");
    }

    if (session.intakeEmailedAt) {
      bookingTraceEnd(traceId, "blocked", {
        stage: "6_booking_intake_service",
        reason: "already_emailed",
        chatSessionId: input.chatSessionId,
      });
      throw new Error("This intake was already sent to the workshop");
    }

    const name = input.customerName?.trim();
    const phone = input.customerPhone?.trim();
    const preferredDate = input.preferredDate.trim();
    const preferredTime = normalizePreferredWindow(input.preferredTime.trim());
    const service = dedupeServiceLabel(input.service.trim());

    if (name || phone) {
      await chatRepository.updateLeadDraft(session.id, {
        ...(session.leadDraft ?? {}),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        preferredDate,
        callbackWindow: preferredTime,
      });
      if (session.structuredIntake && name) {
        await chatRepository.updateStructuredIntake(session.id, {
          ...session.structuredIntake,
          customer: {
            ...session.structuredIntake.customer,
            name,
            contact: phone ?? session.structuredIntake.customer.contact,
          },
          intent: session.structuredIntake.intent || "book",
          preferredBookingTime:
            session.structuredIntake.preferredBookingTime ||
            `${preferredDate} ${preferredTime}`.trim(),
        });
      }
    }

    const refreshed = (await chatRepository.findById(session.id)) ?? session;
    const draft = refreshed.leadDraft;

    if (!draft?.name || !draft?.phone) {
      bookingTraceEnd(traceId, "blocked", {
        stage: "6_booking_intake_service",
        reason: "missing_lead_draft_contact",
        hasName: Boolean(draft?.name),
        hasPhone: Boolean(draft?.phone),
      });
      throw new Error("Complete the service advisor conversation before submitting");
    }

    const contact = validateLeadContact(draft.name, draft.phone);
    if (!contact.canSubmit) {
      bookingTraceEnd(traceId, "blocked", {
        stage: "6_booking_intake_service",
        reason: "invalid_lead_contact",
      });
      throw new Error("Complete the service advisor conversation before submitting");
    }

    const uploads = await uploadService.getByIds(input.uploadIds ?? []);

    const caseSummary = buildWorkshopCaseSummary(refreshed, {
      kind: "booking",
      booking: {
        service,
        preferredDate,
        preferredTime,
        registration: input.registration,
      },
    });

    const summary: ServiceIntakeSummary = {
      caseSummary,
      customerName: draft.name,
      customerPhone: draft.phone,
      registration: caseSummary.registration,
      vehicle: caseSummary.vehicle,
      vehicleEngine: caseSummary.vehicleEngine,
      bookingSlot: {
        service,
        preferredDate,
        preferredTime,
      },
      symptoms: caseSummary.symptoms,
      possibleCauses: caseSummary.possibleCauses ?? [],
      estimatedRange: caseSummary.estimatedRange,
      uploadedFiles: uploads.map((u) => ({
        id: u.id,
        fileName: u.fileName,
        mimeType: u.mimeType,
        category: u.category,
      })),
      callbackAvailability: draft.callbackWindow,
      urgency: caseSummary.urgency,
      severity: refreshed.mechanicSummary?.severity ?? refreshed.intakeState?.severity,
      severityNote: caseSummary.recommendedAction,
      chatSessionId: session.id,
      preparedAt: caseSummary.preparedAt,
    };

    const notes = [
      caseSummary.symptoms ? `Symptoms: ${caseSummary.symptoms}` : null,
      summary.possibleCauses.length
        ? `Possible causes: ${summary.possibleCauses.join(", ")}`
        : null,
      summary.estimatedRange ? `Indicative: ${summary.estimatedRange}` : null,
      `Urgency: ${summary.urgency}`,
      caseSummary.recommendedAction
        ? `Recommended action: ${caseSummary.recommendedAction}`
        : null,
      uploads.length ? `Attachments: ${uploads.length} file(s)` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const customerEmail = draft.email?.trim() || undefined;

    console.info("[booking-intake] submission payload", {
      chatSessionId: session.id,
      service: input.service,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      registration: summary.registration,
      customerName: summary.customerName,
      customerPhone: summary.customerPhone,
      uploadCount: uploads.length,
      hasSymptoms: Boolean(caseSummary.symptoms),
    });

    const { booking, notifications } = await bookingService.create(
      {
        service,
        registration: summary.registration,
        vehicleModel: summary.vehicle,
        preferredDate,
        preferredTime,
        duration: "1h",
        customerName: summary.customerName,
        customerPhone: summary.customerPhone,
        customerEmail,
        notes,
        source: "website",
        intakeSummary: summary,
        uploadIds: uploads.map((u) => u.id),
      },
      {
        intakeNotification: {
          summary,
          transcript: refreshed.messages,
        },
        traceId,
      }
    );

    bookingTraceStage("7_database_insert", traceId, {
      bookingId: booking.id,
      storageBackend: getStorageBackend(),
      registration: booking.registration,
      status: booking.status,
    });

    const workshop = notifications.workshop;
    bookingTraceStage("8_email_send", traceId, {
      bookingId: booking.id,
      emailSent: Boolean(workshop?.sent),
      emailId: workshop?.messageId ?? null,
      provider: workshop?.provider ?? null,
      error: workshop?.error ?? null,
    });
    console.info("[booking-intake] email send result", {
      chatSessionId: session.id,
      bookingId: booking.id,
      emailSent: Boolean(workshop?.sent),
      emailId: workshop?.messageId,
      provider: workshop?.provider,
      error: workshop?.error,
    });

    if (workshop?.sent && workshop.messageId) {
      await chatRepository.markIntakeEmailed(session.id, workshop.messageId);
    }

    const notificationSent = Boolean(workshop?.sent);
    const notificationWarning = notificationSent
      ? undefined
      : workshop?.error ??
        "Workshop notification could not be delivered automatically. Please contact the workshop if you do not hear back shortly.";

    if (!notificationSent) {
      bookingTraceStage("8_email_send", traceId, {
        bookingId: booking.id,
        partialSuccess: true,
        warning: notificationWarning,
      });
    }

    console.info("[booking-intake] completed", {
      chatSessionId: session.id,
      bookingId: booking.id,
      responseStatus: "created",
      intakeSummary: {
        service: summary.bookingSlot.service,
        preferredDate: summary.bookingSlot.preferredDate,
        preferredTime: summary.bookingSlot.preferredTime,
        registration: summary.registration,
      },
    });

    bookingTraceEnd(traceId, "success", {
      bookingId: booking.id,
      emailSent: notificationSent,
      notificationSent,
      adminPersistence: getStorageBackend(),
    });

    return {
      bookingId: booking.id,
      bookingCreated: true,
      notificationSent,
      intakeSummary: summary,
      emailPrepared: true,
      emailSent: notificationSent,
      emailId: workshop?.messageId,
      notificationWarning,
    };
  },
};
