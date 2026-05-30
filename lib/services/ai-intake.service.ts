import { CALLBACK_SUBMIT_SUCCESS } from "@/lib/config/callback-flow-copy";
import { WORKSHOP_SUBMIT_SUCCESS } from "@/lib/config/hero-concierge-copy";
import { buildAiIntakeWorkshopSummary } from "@/lib/email/build-ai-intake-summary";
import { getIntakeEmailRecipients, assertProductionEmailDelivery } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  buildAiIntakeSubject,
  renderAiIntakeEmailHtml,
  renderAiIntakeEmailText,
} from "@/lib/email/templates/ai-intake";
import { resolveAiIntakeSession } from "@/lib/services/ai-intake-session";
import {
  validateCustomerName,
  validateCustomerPhone,
  validateLeadContact,
} from "@/lib/validation/advisor-contact";
import { chatRepository } from "@/lib/repositories/chat.repository";
import { leadService } from "@/lib/services/lead.service";
import { vehicleMemoryService } from "@/lib/services/vehicle-memory.service";
import type { AiIntakeSubmitInput, AiIntakeSubmitResult } from "@/lib/types/ai-intake";
import { isValidEmail, sanitizePlainText } from "@/lib/utils/sanitize";

function rejectPlaceholderContact(name: string, phone: string): void {
  const contact = validateLeadContact(name, phone);
  if (!contact.canSubmit) {
    throw new Error(
      "Valid name and UK phone number are required before sending to the workshop"
    );
  }
}

export const aiIntakeService = {
  async submit(input: AiIntakeSubmitInput): Promise<AiIntakeSubmitResult> {
    const sessionId = sanitizePlainText(input.chatSessionId, 64);
    if (!sessionId) throw new Error("chatSessionId is required");

    const fromMemory = await chatRepository.findById(sessionId);
    const session = await resolveAiIntakeSession(sessionId, input.snapshot);
    if (!session) throw new Error("Intake session not found");

    if (fromMemory?.intakeEmailedAt) {
      throw new Error("This intake was already sent to the workshop");
    }

    if (input.customerEmail?.trim() && !isValidEmail(input.customerEmail.trim())) {
      throw new Error("Invalid email address");
    }

    const name = input.customerName?.trim();
    const phone = input.customerPhone?.trim();
    if (fromMemory && (name || phone)) {
      await chatRepository.updateLeadDraft(sessionId, {
        ...(session.leadDraft ?? {}),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(input.preferredCallbackTime?.trim()
          ? { callbackWindow: input.preferredCallbackTime.trim() }
          : {}),
      });
      if (fromMemory?.structuredIntake && name) {
        await chatRepository.updateStructuredIntake(sessionId, {
          ...fromMemory.structuredIntake,
          customer: {
            ...fromMemory.structuredIntake.customer,
            name,
            contact: phone ?? fromMemory.structuredIntake.customer.contact,
          },
          intent: fromMemory.structuredIntake.intent || "callback",
        });
      }
    }

    const refreshed = (await chatRepository.findById(sessionId)) ?? session;

    if (name || phone || input.preferredCallbackTime?.trim()) {
      refreshed.leadDraft = {
        ...(refreshed.leadDraft ?? {}),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(input.preferredCallbackTime?.trim()
          ? { callbackWindow: input.preferredCallbackTime.trim() }
          : {}),
      };
    }

    const summary = await buildAiIntakeWorkshopSummary(refreshed, {
      uploadIds: input.uploadIds,
      customerEmail: input.customerEmail?.trim(),
    });

    const resolvedName =
      name || (summary.customerName !== "Not provided" ? summary.customerName : undefined);
    const resolvedPhone =
      phone || (summary.customerPhone !== "Not provided" ? summary.customerPhone : undefined);

    rejectPlaceholderContact(resolvedName ?? "", resolvedPhone ?? "");

    const nameCheck = validateCustomerName(resolvedName);
    const phoneCheck = validateCustomerPhone(resolvedPhone);
    if (!nameCheck.valid || !phoneCheck.valid) {
      throw new Error(
        "Valid name and UK phone number are required before sending to the workshop"
      );
    }

    // Graceful partial-data policy for issue context — contact is mandatory.
    const hasAnyIssueContext =
      Boolean(summary.caseSummary.symptoms?.trim()) ||
      summary.warningLights.length > 0 ||
      summary.possibleCauses.length > 0 ||
      summary.transcript.some((m) => m.role === "user");

    if (!hasAnyIssueContext) {
      throw new Error("Nothing collected yet — finish the advisor conversation");
    }

    const subject = buildAiIntakeSubject(summary);
    const text = renderAiIntakeEmailText(summary);
    const html = renderAiIntakeEmailHtml(summary);

    const recipients = getIntakeEmailRecipients();
    if (recipients.length === 0) {
      throw new Error("Workshop email is not configured (BOOKING_EMAIL_TO)");
    }

    assertProductionEmailDelivery();

    console.info("[ai-intake] submission payload", {
      chatSessionId: sessionId,
      intent: summary.intent,
      customerName: nameCheck.normalized,
      customerPhone: phoneCheck.normalized,
      registration: summary.registration,
      callbackAvailability: summary.callbackAvailability,
      preferredBookingTime: summary.preferredBookingTime,
      uploadCount: summary.uploadedFiles.length,
      recipientCount: recipients.length,
    });

    const sent = await sendTransactionalEmail({
      to: recipients,
      subject,
      text,
      html,
      replyTo: summary.customerEmail,
    });

    const emailSent = sent.provider === "resend";

    console.info("[ai-intake] email send result", {
      chatSessionId: sessionId,
      emailSent,
      emailId: sent.id,
      provider: sent.provider,
      intent: summary.intent,
    });

    if (
      process.env.NODE_ENV === "production" &&
      (!emailSent || sent.provider === "log")
    ) {
      throw new Error(
        "Workshop email could not be sent — callback request was not completed."
      );
    }

    if (fromMemory) {
      await chatRepository.markIntakeEmailed(sessionId, sent.id);
    }

    let leadId: string;
    if (!fromMemory?.leadCaptured) {
      const lead = await leadService.create(
        {
          name: nameCheck.normalized,
          phone: phoneCheck.normalized,
          email: summary.customerEmail,
          registration: summary.registration,
          vehicleModel: summary.vehicle,
          problemDescription: summary.symptoms || undefined,
          preferredDate:
            summary.callbackPreferredDate ??
            summary.preferredBookingTime ??
            summary.callbackAvailability,
          source: summary.intent === "callback" ? "callback" : "assistant",
          caseSummary: summary.caseSummary,
        },
        { suppressWorkshopEmail: true, sourceIntent: summary.intent }
      );
      leadId = lead.id;
      if (fromMemory) {
        await chatRepository.markLeadCaptured(sessionId);
      }
    } else {
      const leads = await leadService.list();
      const match = leads.find(
        (l) =>
          l.phone === phoneCheck.normalized &&
          l.name.toLowerCase() === nameCheck.normalized.toLowerCase()
      );
      if (!match) {
        throw new Error(
          "Could not locate the callback record — please try sending again"
        );
      }
      leadId = match.id;
    }

    // Persist into vehicle memory so the next visit greets this customer
    // as returning. Safe to call with partial data — the service no-ops
    // on missing/invalid registration.
    try {
      await vehicleMemoryService.recordIntake(summary);
    } catch (err) {
      console.warn("[ai-intake] vehicle memory persistence failed", err);
    }

    const submittedAt = new Date().toISOString();
    const confirmationMessage =
      summary.intent === "callback" ? CALLBACK_SUBMIT_SUCCESS : WORKSHOP_SUBMIT_SUCCESS;

    console.info("[ai-intake] completed", {
      chatSessionId: sessionId,
      leadId,
      submittedAt,
      intent: summary.intent,
      emailSent,
      emailId: sent.id,
      responseStatus: "created",
    });

    return {
      leadId,
      submittedAt,
      emailSent,
      emailId: sent.id,
      emailProvider: sent.provider,
      confirmationMessage,
      summary,
    };
  },
};
