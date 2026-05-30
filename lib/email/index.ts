export {
  DEFAULT_EMAIL_FROM,
  getIntakeEmailTo,
  getIntakeEmailRecipients,
  getEmailFrom,
  getEmailApiKey,
  getEmailProvider,
  EMAIL_FROM_DISPLAY,
} from "@/lib/email/config";
export { sendTransactionalEmail } from "@/lib/email/send-transactional";
export { sendWorkshopIntakeEmail } from "@/lib/email/send-workshop-intake";
export {
  sendWorkshopBookingAlert,
  sendCustomerBookingConfirmation,
  sendWorkshopBookingUpdated,
  sendWorkshopBookingCancelled,
} from "@/lib/email/send-booking-alert";
export { sendWorkshopLeadAlert } from "@/lib/email/send-lead-alert";
export {
  prepareBookingIntakeEmail,
  type BookingEmailPayload,
} from "@/lib/email/prepare-booking-email";
export {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
export {
  renderWorkshopAlertText,
  renderWorkshopAlertHtml,
  renderWorkshopAlertSubject,
  renderCustomerConfirmationText,
  renderCustomerConfirmationHtml,
  renderCustomerConfirmationSubject,
} from "@/lib/email/templates/booking-alert";
export {
  renderWorkshopUpdatedText,
  renderWorkshopUpdatedHtml,
  renderWorkshopUpdatedSubject,
  renderWorkshopCancelledText,
  renderWorkshopCancelledHtml,
  renderWorkshopCancelledSubject,
} from "@/lib/email/templates/booking-updated";
export {
  buildAiIntakeSubject,
  renderAiIntakeEmailHtml,
  renderAiIntakeEmailText,
} from "@/lib/email/templates/ai-intake";
export {
  renderLeadAlertHtml,
  renderLeadAlertSubject,
  renderLeadAlertText,
} from "@/lib/email/templates/lead-alert";
