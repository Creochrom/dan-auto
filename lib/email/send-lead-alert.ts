import { getEmailProvider, getIntakeEmailRecipients } from "@/lib/email/config";
import type { NotificationSendResult } from "@/lib/email/send-booking-alert";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  renderLeadAlertHtml,
  renderLeadAlertSubject,
  renderLeadAlertText,
} from "@/lib/email/templates/lead-alert";
import { logLeadEvent } from "@/lib/logging/lead-events";
import type { IntakeIntent } from "@/lib/types/ai-intake";
import type { Lead } from "@/lib/types/lead";

/**
 * Sends mechanic-first workshop alert for a persisted lead.
 * Failures are logged and swallowed — lead persistence is never rolled back.
 */
export async function sendWorkshopLeadAlert(
  lead: Lead,
  opts?: { sourceIntent?: IntakeIntent }
): Promise<NotificationSendResult> {
  const recipients = getIntakeEmailRecipients();
  if (recipients.length === 0) {
    logLeadEvent("notification.failed", {
      kind: "workshop_lead",
      leadId: lead.id,
      provider: getEmailProvider(),
      error: "BOOKING_EMAIL_TO is not configured",
    });
    return { sent: false, error: "BOOKING_EMAIL_TO is not configured" };
  }

  try {
    const result = await sendTransactionalEmail({
      to: recipients,
      subject: renderLeadAlertSubject(lead, opts),
      text: renderLeadAlertText(lead, opts),
      html: renderLeadAlertHtml(lead, opts),
      replyTo: lead.email,
    });
    logLeadEvent("notification.sent", {
      kind: "workshop_lead",
      leadId: lead.id,
      source: lead.source,
      provider: result.provider,
      messageId: result.id,
      recipientDomain: recipients.map((r) => r.split("@")[1] ?? "unknown").join(","),
    });
    return { sent: true, provider: result.provider, messageId: result.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logLeadEvent("notification.failed", {
      kind: "workshop_lead",
      leadId: lead.id,
      source: lead.source,
      provider: getEmailProvider(),
      error,
    });
    return { sent: false, error };
  }
}
