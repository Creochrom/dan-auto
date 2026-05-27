/**
 * Booking notification emails — workshop alert + optional customer confirmation.
 *
 * Called exclusively from bookingService.create() so every booking creation path
 * triggers the same notification logic without duplication.
 *
 * The AI intake path (bookingIntakeService) already sends a richer email that
 * includes the conversation transcript. It passes suppressWorkshopEmail: true to
 * bookingService.create() so only the customer confirmation fires from here.
 */

import { getIntakeEmailTo } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  renderCustomerConfirmationHtml,
  renderCustomerConfirmationSubject,
  renderCustomerConfirmationText,
  renderWorkshopAlertHtml,
  renderWorkshopAlertSubject,
  renderWorkshopAlertText,
} from "@/lib/email/templates/booking-alert";
import type { Booking } from "@/lib/types/booking";

/**
 * Sends the workshop booking alert to the configured recipient.
 * Used for bookings that do NOT already have a richer AI intake email.
 *
 * Failures are logged and swallowed — the booking is already persisted and
 * should not roll back due to a transient email error.
 */
export async function sendWorkshopBookingAlert(booking: Booking): Promise<void> {
  try {
    await sendTransactionalEmail({
      to: getIntakeEmailTo(),
      subject: renderWorkshopAlertSubject(booking),
      text: renderWorkshopAlertText(booking),
      html: renderWorkshopAlertHtml(booking),
      replyTo: booking.customerEmail,
    });
  } catch (err) {
    console.error("[booking-notification] workshop alert failed", {
      bookingId: booking.id,
      registration: booking.registration,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Sends a booking confirmation to the customer.
 * No-ops silently when customerEmail is absent.
 *
 * Failures are logged and swallowed — a failed confirmation email is not a
 * reason to surface an error to the customer who has already submitted.
 */
export async function sendCustomerBookingConfirmation(booking: Booking): Promise<void> {
  if (!booking.customerEmail) return;

  try {
    await sendTransactionalEmail({
      to: booking.customerEmail,
      subject: renderCustomerConfirmationSubject(booking),
      text: renderCustomerConfirmationText(booking),
      html: renderCustomerConfirmationHtml(booking),
    });
  } catch (err) {
    console.error("[booking-notification] customer confirmation failed", {
      bookingId: booking.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
