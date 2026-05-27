import { getEmailProvider, getIntakeEmailTo } from "@/lib/email/config";
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
  const to = getIntakeEmailTo();
  if (!to) {
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

  try {
    const result = await sendTransactionalEmail({
      to,
      subject,
      text: renderBookingIntakeEmailText(summary, opts?.transcript),
      html: renderBookingIntakeEmailHtml(summary, opts?.transcript),
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
