/**
 * Email templates for direct booking notifications.
 *
 * Two templates:
 *  1. Workshop alert   — sent to the workshop on every booking creation.
 *  2. Customer confirmation — sent to the customer when customerEmail is present.
 *
 * These are intentionally simpler than the AI intake email (booking-intake.ts)
 * which includes the full conversation transcript. Callers that already send
 * the richer AI intake email must set suppressWorkshopEmail: true on
 * bookingService.create() to avoid duplicate workshop notifications.
 */

import { BRAND } from "@/lib/config/brand";
import {
  formatBookingDateDisplay,
  formatBookingSlotForSubject,
  formatRegistrationForSubject,
} from "@/lib/booking/format-booking-display";
import { businessConfig } from "@/lib/config/business";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  renderWorkshopBookingHtml,
  renderWorkshopBookingText,
  renderWorkshopContactHtml,
  renderWorkshopContactText,
  renderWorkshopIdsHtml,
  renderWorkshopIdsText,
  renderWorkshopPhoneBannerHtml,
  renderWorkshopPhoneBannerText,
} from "@/lib/email/templates/workshop-shared";
import { escapeHtml } from "@/lib/utils/sanitize";
import type { Booking } from "@/lib/types/booking";

// ---------------------------------------------------------------------------
// Workshop alert — sent to the workshop inbox
// ---------------------------------------------------------------------------

export function renderWorkshopAlertSubject(booking: Booking): string {
  const reg = formatRegistrationForSubject(booking.registration);
  const slot = formatBookingSlotForSubject(booking.preferredDate, booking.preferredTime);
  return slot ? `New Booking – ${reg} – ${slot}` : `New Booking – ${reg}`;
}

export function renderWorkshopAlertText(booking: Booking): string {
  const contact = {
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    registration: booking.registration,
    bookingId: booking.id,
  };
  const bookingDetails = {
    service: booking.service,
    preferredDate: formatBookingDateDisplay(booking.preferredDate),
    preferredTime: booking.preferredTime,
    notes: booking.notes,
    sourceLabel: formatWorkshopSourceLabel(booking.source),
  };

  return [
    `${BRAND.shortName} — New Booking`,
    "",
    ...renderWorkshopPhoneBannerText(
      contact.customerName,
      contact.customerPhone,
      contact.customerEmail
    ),
    ...renderWorkshopIdsText(contact),
    ...renderWorkshopContactText(contact),
    ...renderWorkshopBookingText(bookingDetails),
    `Duration:      ${formatWorkshopField(booking.duration)}`,
    `Vehicle:       ${formatWorkshopField(booking.vehicleModel)}`,
    `Submitted:     ${formatWorkshopField(booking.createdAt)}`,
    "",
    `— ${BRAND.shortName} booking system`,
  ].join("\n");
}

export function renderWorkshopAlertHtml(booking: Booking): string {
  const contact = {
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    registration: booking.registration,
    bookingId: booking.id,
  };
  const bookingDetails = {
    service: booking.service,
    preferredDate: formatBookingDateDisplay(booking.preferredDate),
    preferredTime: booking.preferredTime,
    notes: booking.notes,
    sourceLabel: formatWorkshopSourceLabel(booking.source),
  };

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 16px">New Booking</h1>

  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone, contact.customerEmail)}
  ${renderWorkshopIdsHtml(contact)}
  ${renderWorkshopContactHtml(contact)}
  ${renderWorkshopBookingHtml(bookingDetails)}

  <p style="margin:0;font-size:12px;color:#71717a">
    Duration: ${escapeHtml(formatWorkshopField(booking.duration))}
    · Vehicle: ${escapeHtml(formatWorkshopField(booking.vehicleModel))}
    · Submitted: ${escapeHtml(formatWorkshopField(booking.createdAt))}
  </p>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Customer confirmation — sent to the customer when customerEmail is present
// ---------------------------------------------------------------------------

export function renderCustomerConfirmationSubject(booking: Booking): string {
  return `Your booking request at ${BRAND.shortName} — ${booking.registration}`;
}

export function renderCustomerConfirmationText(booking: Booking): string {
  return [
    `Hi ${booking.customerName},`,
    "",
    `We received your request. Our team will contact you shortly.`,
    "",
    "YOUR REQUEST DETAILS",
    `Service:       ${booking.service}`,
    `Preferred date: ${booking.preferredDate}`,
    `Preferred time: ${booking.preferredTime}`,
    `Registration:  ${booking.registration}`,
    "",
    "This is not a confirmed appointment time — we will be in touch to arrange your visit.",
    `If you need to reach us sooner, call ${businessConfig.phone.display}.`,
    "",
    `— ${BRAND.shortName}`,
    businessConfig.address.line,
  ].join("\n");
}

export function renderCustomerConfirmationHtml(booking: Booking): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 4px">Booking request received</h1>
  <p style="color:#71717a;font-size:14px;margin:0 0 20px">${escapeHtml(BRAND.shortName)}</p>

  <p>Hi ${escapeHtml(booking.customerName)},</p>
  <p>We received your request. Our team will contact you shortly.</p>
  <p style="font-size:13px;color:#a1a1aa">This is not a confirmed appointment time — we will be in touch to arrange your visit.</p>

  <h2 style="font-size:14px;color:#d4a63c;margin:20px 0 8px">Your booking details</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Service</td><td style="padding:5px 0"><strong>${escapeHtml(booking.service)}</strong></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Date</td><td style="padding:5px 0">${escapeHtml(booking.preferredDate)}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Time</td><td style="padding:5px 0">${escapeHtml(booking.preferredTime)}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Registration</td><td style="padding:5px 0"><strong style="font-family:monospace;color:#d4a63c">${escapeHtml(booking.registration)}</strong></td></tr>
  </table>

  <p style="margin-top:20px">Need to make a change? Call us on
    <a href="${escapeHtml(businessConfig.phone.telHref)}" style="color:#22d3ee">${escapeHtml(businessConfig.phone.display)}</a>
    or reply to this email.
  </p>

  <p style="margin-top:24px;font-size:13px;color:#71717a">
    ${escapeHtml(BRAND.shortName)}<br>
    ${escapeHtml(businessConfig.address.line)}
  </p>
</body>
</html>`;
}
