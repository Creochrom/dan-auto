import { BRAND } from "@/lib/config/brand";
import { buildAiIntakeWorkshopSummary } from "@/lib/email/build-ai-intake-summary";
import { getIntakeEmailTo } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  buildAiIntakeSubject,
  renderAiIntakeEmailHtml,
  renderAiIntakeEmailText,
} from "@/lib/email/templates/ai-intake";
import { chatRepository } from "@/lib/repositories/chat.repository";
import { leadService } from "@/lib/services/lead.service";
import type { AiIntakeSubmitInput, AiIntakeSubmitResult } from "@/lib/types/ai-intake";
import { isValidEmail, sanitizePlainText } from "@/lib/utils/sanitize";

const CONFIRMATION_MESSAGE = `Perfect — I've prepared your workshop intake and sent it to the ${BRAND.shortName} team. A mechanic will review the information and contact you shortly.`;

export const aiIntakeService = {
  async submit(input: AiIntakeSubmitInput): Promise<AiIntakeSubmitResult> {
    const sessionId = sanitizePlainText(input.chatSessionId, 64);
    if (!sessionId) throw new Error("chatSessionId is required");

    const session = chatRepository.findById(sessionId);
    if (!session) throw new Error("Intake session not found");

    if (session.intakeEmailedAt) {
      throw new Error("This intake was already sent to the workshop");
    }

    const draft = session.leadDraft;
    if (!draft?.name?.trim() || !draft?.phone?.trim()) {
      throw new Error("Complete the service advisor conversation before submitting");
    }

    const intake = session.intakeState;
    const ready =
      intake?.phase === "complete" ||
      intake?.leadCaptured ||
      session.leadCaptured ||
      Boolean(session.mechanicSummary);

    if (!ready) {
      throw new Error("Intake is not complete yet — finish the advisor conversation");
    }

    if (input.customerEmail?.trim() && !isValidEmail(input.customerEmail.trim())) {
      throw new Error("Invalid email address");
    }

    const summary = buildAiIntakeWorkshopSummary(session, {
      uploadIds: input.uploadIds,
      customerEmail: input.customerEmail?.trim(),
    });

    if (!summary.symptoms || summary.symptoms === "Not specified") {
      throw new Error("Symptom description is required");
    }

    const subject = buildAiIntakeSubject(summary);
    const text = renderAiIntakeEmailText(summary);
    const html = renderAiIntakeEmailHtml(summary);

    const sent = await sendTransactionalEmail({
      to: getIntakeEmailTo(),
      subject,
      text,
      html,
      replyTo: summary.customerEmail,
    });

    chatRepository.markIntakeEmailed(sessionId, sent.id);

    if (!session.leadCaptured) {
      leadService.create({
        name: summary.customerName,
        phone: summary.customerPhone,
        registration: summary.registration,
        vehicleModel: summary.vehicle,
        problemDescription: summary.symptoms,
        preferredDate: summary.callbackAvailability,
        source: "assistant",
        aiSummary: [
          `Service: ${summary.serviceRequested}`,
          `Causes: ${summary.possibleCauses.join("; ")}`,
          `Range: ${summary.estimatedRange ?? "—"}`,
          `Urgency: ${summary.urgency}`,
        ].join("\n"),
      });
      chatRepository.markLeadCaptured(sessionId);
    }

    return {
      emailId: sent.id,
      confirmationMessage: CONFIRMATION_MESSAGE,
      summary,
    };
  },
};
