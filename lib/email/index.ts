export { BOOKING_EMAIL_TO, EMAIL_FROM_DISPLAY } from "@/lib/email/config";
export {
  prepareBookingIntakeEmail,
  type BookingEmailPayload,
} from "@/lib/email/prepare-booking-email";
export {
  renderBookingIntakeEmailHtml,
  renderBookingIntakeEmailText,
} from "@/lib/email/templates/booking-intake";
