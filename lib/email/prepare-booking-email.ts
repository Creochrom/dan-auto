import { getIntakeEmailTo, getEmailFrom } from "@/lib/email/config";
import {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
import type { ChatMessage } from "@/lib/types/chat";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

/**
 * Structured email payload — preview / tests (sending via sendBookingIntakeEmail).
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
  };
};

export function prepareBookingIntakeEmail(
  summary: ServiceIntakeSummary,
  bookingId?: string,
  transcript?: ChatMessage[]
): BookingEmailPayload {
  const reg = summary.registration.replace(/\s/g, "");
  const subject = `New AI Service Intake — ${reg} — ${summary.bookingSlot.service}`;

  return {
    to: getIntakeEmailTo(),
    from: getEmailFrom(),
    subject,
    text: renderBookingIntakeEmailText(summary, transcript),
    html: renderBookingIntakeEmailHtml(summary, transcript),
    summary,
    meta: {
      preparedAt: new Date().toISOString(),
      bookingId,
    },
  };
}
