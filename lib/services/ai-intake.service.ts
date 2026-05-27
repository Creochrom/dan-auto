import { CALLBACK_SUBMIT_SUCCESS } from "@/lib/config/callback-flow-copy";
import { WORKSHOP_SUBMIT_SUCCESS } from "@/lib/config/hero-concierge-copy";
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
import { vehicleMemoryService } from "@/lib/services/vehicle-memory.service";
import type { AiIntakeSubmitInput, AiIntakeSubmitResult } from "@/lib/types/ai-intake";
import { isValidEmail, sanitizePlainText } from "@/lib/utils/sanitize";

export const aiIntakeService = {
  async submit(input: AiIntakeSubmitInput): Promise<AiIntakeSubmitResult> {
    const sessionId = sanitizePlainText(input.chatSessionId, 64);
    if (!sessionId) throw new Error("chatSessionId is required");

    const session = chatRepository.findById(sessionId);
    if (!session) throw new Error("Intake session not found");

    if (session.intakeEmailedAt) {
      throw new Error("This intake was already sent to the workshop");
    }

    if (input.customerEmail?.trim() && !isValidEmail(input.customerEmail.trim())) {
      throw new Error("Invalid email address");
    }

    const name = input.customerName?.trim();
    const phone = input.customerPhone?.trim();
    if (name || phone) {
      chatRepository.updateLeadDraft(sessionId, {
        ...(session.leadDraft ?? {}),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(input.preferredCallbackTime?.trim()
          ? { callbackWindow: input.preferredCallbackTime.trim() }
          : {}),
      });
      if (session.structuredIntake && name) {
        chatRepository.updateStructuredIntake(sessionId, {
          ...session.structuredIntake,
          customer: {
            ...session.structuredIntake.customer,
            name,
            contact: phone ?? session.structuredIntake.customer.contact,
          },
          intent: session.structuredIntake.intent || "callback",
        });
      }
    }

    const refreshed = chatRepository.findById(sessionId) ?? session;

    const summary = buildAiIntakeWorkshopSummary(refreshed, {
      uploadIds: input.uploadIds,
      customerEmail: input.customerEmail?.trim(),
    });

    // Graceful partial-data policy: send the lead even if some fields are
    // missing — the workshop would rather have an incomplete lead than no
    // lead at all. We only refuse if there is truly nothing actionable
    // (no contact at all AND no symptoms AND no transcript content).
    const hasAnyContact =
      summary.customerName !== "Not provided" ||
      summary.customerPhone !== "Not provided" ||
      Boolean(summary.customerEmail);
    const hasAnyIssueContext =
      Boolean(summary.symptoms && summary.symptoms !== "Not specified — see transcript") ||
      summary.warningLights.length > 0 ||
      summary.possibleCauses.length > 0 ||
      summary.transcript.some((m) => m.role === "user");

    if (!hasAnyContact && !hasAnyIssueContext) {
      throw new Error("Nothing collected yet — finish the advisor conversation");
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

    // Persist into vehicle memory so the next visit greets this customer
    // as returning. Safe to call with partial data — the service no-ops
    // on missing/invalid registration.
    try {
      vehicleMemoryService.recordIntake(summary);
    } catch (err) {
      console.warn("[ai-intake] vehicle memory persistence failed", err);
    }

    if (!session.leadCaptured) {
      await leadService.create({
        name: summary.customerName,
        phone: summary.customerPhone,
        registration: summary.registration,
        vehicleModel: summary.vehicle,
        problemDescription: summary.symptoms,
        preferredDate: summary.preferredBookingTime ?? summary.callbackAvailability,
        source: "assistant",
        aiSummary: [
          summary.aiSummary ? `Summary: ${summary.aiSummary}` : null,
          `Service: ${summary.serviceRequested}`,
          summary.warningLights.length
            ? `Warning lights: ${summary.warningLights.join(", ")}`
            : null,
          `Drivability: ${summary.drivability}`,
          `Intent: ${summary.intent}`,
          summary.possibleCauses.length
            ? `Causes: ${summary.possibleCauses.join("; ")}`
            : null,
          `Range: ${summary.estimatedRange ?? "—"}`,
          `Urgency: ${summary.urgency}`,
          summary.partial ? `Partial — missing: ${summary.missingFields.join(", ")}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      });
      chatRepository.markLeadCaptured(sessionId);
    }

    const confirmationMessage =
      summary.intent === "callback" ? CALLBACK_SUBMIT_SUCCESS : WORKSHOP_SUBMIT_SUCCESS;

    return {
      emailId: sent.id,
      confirmationMessage,
      summary,
    };
  },
};
