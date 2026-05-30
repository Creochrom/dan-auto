import { getEmailProvider, getIntakeEmailRecipients } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
import { logBookingEvent } from "@/lib/logging/booking-events";
import type { NotificationSendResult } from "@/lib/email/send-booking-alert";
import type { Booking } from "@/lib/types/booking";
import type { ChatMessage } from "@/lib/types/chat";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

/**
 * Richer workshop email for AI-assisted intake (includes transcript).
 * Invoked from bookingService.create() when intakeNotification is provided.
 */
export async function sendWorkshopIntakeEmail(
  booking: Booking,
  summary: ServiceIntakeSummary,
  opts?: { transcript?: ChatMessage[] }
): Promise<NotificationSendResult> {
  const recipients = getIntakeEmailRecipients();
  if (recipients.length === 0) {
    logBookingEvent("notification.failed", {
      kind: "workshop_intake",
      bookingId: booking.id,
      provider: getEmailProvider(),
      error: "BOOKING_EMAIL_TO is not configured",
    });
    return { sent: false, error: "BOOKING_EMAIL_TO is not configured" };
  }

  const reg = summary.registration.replace(/\s/g, "");
  const subject = `New AI Service Intake — ${reg} — ${summary.bookingSlot.service}`;
  const emailOpts = {
    transcript: opts?.transcript,
    bookingId: booking.id,
    customerEmail: booking.customerEmail,
  };

  try {
    const result = await sendTransactionalEmail({
      to: recipients,
      subject,
      text: renderBookingIntakeEmailText(summary, emailOpts),
      html: renderBookingIntakeEmailHtml(summary, emailOpts),
      replyTo: booking.customerEmail,
    });
    logBookingEvent("notification.sent", {
      kind: "workshop_intake",
      bookingId: booking.id,
      provider: result.provider,
      messageId: result.id,
    });
    return { sent: true, provider: result.provider, messageId: result.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logBookingEvent("notification.failed", {
      kind: "workshop_intake",
      bookingId: booking.id,
      provider: getEmailProvider(),
      error,
    });
    return { sent: false, error };
  }
}
