/**
 * Booking notification emails — workshop alert + optional customer confirmation.
 *
 * Called exclusively from bookingService.create() so every booking creation path
 * triggers the same notification logic without duplication.
 */

import { getEmailProvider, getIntakeEmailRecipients } from "@/lib/email/config";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  renderCustomerConfirmationHtml,
  renderCustomerConfirmationSubject,
  renderCustomerConfirmationText,
  renderWorkshopAlertHtml,
  renderWorkshopAlertSubject,
  renderWorkshopAlertText,
} from "@/lib/email/templates/booking-alert";
import { logBookingEvent } from "@/lib/logging/booking-events";
import type { Booking } from "@/lib/types/booking";

export type NotificationSendResult = {
  sent: boolean;
  provider?: "resend" | "log";
  messageId?: string;
  error?: string;
  skipped?: boolean;
};

/**
 * Sends the workshop booking alert to the configured recipient.
 * Failures are logged and swallowed — booking persistence is never rolled back.
 */
export async function sendWorkshopBookingAlert(
  booking: Booking
): Promise<NotificationSendResult> {
  const recipients = getIntakeEmailRecipients();
  if (recipients.length === 0) {
    logBookingEvent("notification.failed", {
      kind: "workshop",
      bookingId: booking.id,
      provider: getEmailProvider(),
      error: "BOOKING_EMAIL_TO is not configured",
    });
    return { sent: false, error: "BOOKING_EMAIL_TO is not configured" };
  }

  try {
    const result = await sendTransactionalEmail({
      to: recipients,
      subject: renderWorkshopAlertSubject(booking),
      text: renderWorkshopAlertText(booking),
      html: renderWorkshopAlertHtml(booking),
      replyTo: booking.customerEmail,
    });
    logBookingEvent("notification.sent", {
      kind: "workshop",
      bookingId: booking.id,
      provider: result.provider,
      messageId: result.id,
      recipientDomain: recipients.map((r) => r.split("@")[1] ?? "unknown").join(","),
    });
    return { sent: true, provider: result.provider, messageId: result.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logBookingEvent("notification.failed", {
      kind: "workshop",
      bookingId: booking.id,
      registration: booking.registration,
      provider: getEmailProvider(),
      error,
    });
    return { sent: false, error };
  }
}

/**
 * Sends a lightweight request-received confirmation to the customer.
 * No-ops when customerEmail is absent. Does not imply a confirmed appointment time.
 */
export async function sendCustomerBookingConfirmation(
  booking: Booking
): Promise<NotificationSendResult> {
  if (!booking.customerEmail) {
    logBookingEvent("notification.skipped", {
      kind: "customer",
      bookingId: booking.id,
      reason: "no_customer_email",
    });
    return { sent: false, skipped: true };
  }

  try {
    const result = await sendTransactionalEmail({
      to: booking.customerEmail,
      subject: renderCustomerConfirmationSubject(booking),
      text: renderCustomerConfirmationText(booking),
      html: renderCustomerConfirmationHtml(booking),
    });
    logBookingEvent("notification.sent", {
      kind: "customer",
      bookingId: booking.id,
      provider: result.provider,
      messageId: result.id,
    });
    return { sent: true, provider: result.provider, messageId: result.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logBookingEvent("notification.failed", {
      kind: "customer",
      bookingId: booking.id,
      provider: getEmailProvider(),
      error,
    });
    return { sent: false, error };
  }
}
