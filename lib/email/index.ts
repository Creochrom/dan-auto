export {
  DEFAULT_EMAIL_FROM,
  getIntakeEmailTo,
  getEmailFrom,
  getEmailApiKey,
  getEmailProvider,
  BOOKING_EMAIL_TO,
  EMAIL_FROM_DISPLAY,
} from "@/lib/email/config";
export { sendTransactionalEmail } from "@/lib/email/send-transactional";
export { sendBookingIntakeEmail } from "@/lib/email/send-workshop-intake";
export {
  prepareBookingIntakeEmail,
  type BookingEmailPayload,
} from "@/lib/email/prepare-booking-email";
export {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
export {
  buildAiIntakeSubject,
  renderAiIntakeEmailHtml,
  renderAiIntakeEmailText,
} from "@/lib/email/templates/ai-intake";
