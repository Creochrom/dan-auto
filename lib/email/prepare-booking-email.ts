import { BOOKING_EMAIL_TO, EMAIL_FROM_DISPLAY } from "@/lib/email/config";
import {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

/**
 * Structured email payload — ready for Resend / SendGrid / Postmark.
 * TODO: send via transactional provider when enabled.
 */
export type BookingEmailPayload = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  summary: ServiceIntakeSummary;
  meta: {
    preparedAt: string;
    bookingId?: string;
    sendEnabled: false;
  };
};

export function prepareBookingIntakeEmail(
  summary: ServiceIntakeSummary,
  bookingId?: string
): BookingEmailPayload {
  const reg = summary.registration.replace(/\s/g, "");
  const subject = `Booking intake · ${reg} · ${summary.bookingSlot.service} · ${summary.customerName}`;

  return {
    to: BOOKING_EMAIL_TO,
    from: EMAIL_FROM_DISPLAY,
    subject,
    text: renderBookingIntakeEmailText(summary),
    html: renderBookingIntakeEmailHtml(summary),
    summary,
    meta: {
      preparedAt: new Date().toISOString(),
      bookingId,
      sendEnabled: false,
    },
  };
}
