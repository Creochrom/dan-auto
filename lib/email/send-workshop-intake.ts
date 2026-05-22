import { getIntakeEmailTo } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
import type { ChatMessage } from "@/lib/types/chat";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

export async function sendBookingIntakeEmail(
  summary: ServiceIntakeSummary,
  opts?: { bookingId?: string; transcript?: ChatMessage[] }
) {
  const reg = summary.registration.replace(/\s/g, "");
  const subject = `New AI Service Intake — ${reg} — ${summary.bookingSlot.service}`;

  return sendTransactionalEmail({
    to: getIntakeEmailTo(),
    subject,
    text: renderBookingIntakeEmailText(summary, opts?.transcript),
    html: renderBookingIntakeEmailHtml(summary, opts?.transcript),
  });
}
