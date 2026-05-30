import { CALLBACK_SUBMIT_SUCCESS } from "@/lib/config/callback-flow-copy";
import { WORKSHOP_SUBMIT_SUCCESS } from "@/lib/config/hero-concierge-copy";
import { buildAiIntakeWorkshopSummary } from "@/lib/email/build-ai-intake-summary";
import { getIntakeEmailRecipients } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  buildAiIntakeSubject,
  renderAiIntakeEmailHtml,
  renderAiIntakeEmailText,
} from "@/lib/email/templates/ai-intake";
import { resolveAiIntakeSession } from "@/lib/services/ai-intake-session";
import { chatRepository } from "@/lib/repositories/chat.repository";
import { leadService } from "@/lib/services/lead.service";
import { vehicleMemoryService } from "@/lib/services/vehicle-memory.service";
import type { AiIntakeSubmitInput, AiIntakeSubmitResult } from "@/lib/types/ai-intake";
import { isValidEmail, sanitizePlainText } from "@/lib/utils/sanitize";

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

    const recipients = getIntakeEmailRecipients();
    if (recipients.length === 0) {
      throw new Error("Workshop email is not configured (BOOKING_EMAIL_TO)");
    }

    const sent = await sendTransactionalEmail({
      to: recipients,
      subject,
      text,
      html,
      replyTo: summary.customerEmail,
    });

    if (fromMemory) {
      await chatRepository.markIntakeEmailed(sessionId, sent.id);
    }

    // Persist into vehicle memory so the next visit greets this customer
    // as returning. Safe to call with partial data — the service no-ops
    // on missing/invalid registration.
    try {
      await vehicleMemoryService.recordIntake(summary);
    } catch (err) {
      console.warn("[ai-intake] vehicle memory persistence failed", err);
    }

    if (!fromMemory?.leadCaptured) {
      await leadService.create(
        {
          name: summary.customerName,
          phone: summary.customerPhone,
          email: summary.customerEmail,
          registration: summary.registration,
          vehicleModel: summary.vehicle,
          problemDescription: summary.symptoms,
          preferredDate: summary.preferredBookingTime ?? summary.callbackAvailability,
          source: summary.intent === "callback" ? "callback" : "assistant",
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
        },
        { suppressWorkshopEmail: true, sourceIntent: summary.intent }
      );
      if (fromMemory) {
        await chatRepository.markLeadCaptured(sessionId);
      }
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
