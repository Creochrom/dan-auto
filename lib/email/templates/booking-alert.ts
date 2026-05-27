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
import { businessConfig } from "@/lib/config/business";
import { escapeHtml, sanitizePlainText } from "@/lib/utils/sanitize";
import type { Booking } from "@/lib/types/booking";

// ---------------------------------------------------------------------------
// Workshop alert — sent to contact@danautocentre.co.uk
// ---------------------------------------------------------------------------

export function renderWorkshopAlertSubject(booking: Booking): string {
  const reg = booking.registration.replace(/\s/g, "");
  return `New Booking Request — ${reg} — ${booking.service}`;
}

export function renderWorkshopAlertText(booking: Booking): string {
  const note = booking.notes ? sanitizePlainText(booking.notes, 1000) : "—";

  return [
    `${BRAND.shortName} — New Booking Request`,
    "",
    `Customer:      ${booking.customerName}`,
    `Phone:         ${booking.customerPhone}`,
    `Email:         ${booking.customerEmail ?? "—"}`,
    `Registration:  ${booking.registration}`,
    `Vehicle:       ${booking.vehicleModel ?? "—"}`,
    "",
    "BOOKING DETAILS",
    `Service:       ${booking.service}`,
    `Date:          ${booking.preferredDate}`,
    `Time:          ${booking.preferredTime}`,
    `Duration:      ${booking.duration}`,
    `Source:        ${booking.source}`,
    "",
    "NOTES",
    note,
    "",
    "---",
    `Booking ID:    ${booking.id}`,
    `Submitted:     ${booking.createdAt}`,
    `— ${BRAND.shortName} booking system`,
  ].join("\n");
}

export function renderWorkshopAlertHtml(booking: Booking): string {
  const note = booking.notes
    ? escapeHtml(sanitizePlainText(booking.notes, 1000))
    : "<em style='color:#71717a'>None</em>";

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 16px">New Booking Request</h1>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr><td style="padding:5px 12px 5px 0;color:#71717a;white-space:nowrap">Customer</td><td style="padding:5px 0"><strong>${escapeHtml(booking.customerName)}</strong></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Phone</td><td style="padding:5px 0"><a href="tel:${escapeHtml(booking.customerPhone)}" style="color:#22d3ee">${escapeHtml(booking.customerPhone)}</a></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Email</td><td style="padding:5px 0">${booking.customerEmail ? `<a href="mailto:${escapeHtml(booking.customerEmail)}" style="color:#22d3ee">${escapeHtml(booking.customerEmail)}</a>` : "<span style='color:#52525b'>—</span>"}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Registration</td><td style="padding:5px 0"><strong style="font-family:monospace;color:#d4a63c">${escapeHtml(booking.registration)}</strong></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Vehicle</td><td style="padding:5px 0">${escapeHtml(booking.vehicleModel ?? "—")}</td></tr>
  </table>

  <h2 style="font-size:14px;color:#d4a63c;margin:0 0 8px">Booking Slot</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Service</td><td style="padding:5px 0"><strong>${escapeHtml(booking.service)}</strong></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Date</td><td style="padding:5px 0">${escapeHtml(booking.preferredDate)}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Time</td><td style="padding:5px 0">${escapeHtml(booking.preferredTime)}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Duration</td><td style="padding:5px 0">${escapeHtml(booking.duration)}</td></tr>
  </table>

  <h2 style="font-size:14px;color:#d4a63c;margin:0 0 8px">Notes</h2>
  <div style="background:#111;padding:12px;border-radius:8px;font-size:13px">${note}</div>

  <p style="margin:20px 0 0;font-size:11px;color:#52525b">Booking ID: ${escapeHtml(booking.id)} · Submitted: ${escapeHtml(booking.createdAt)}</p>
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
    `Thanks for submitting your booking request at ${BRAND.shortName}.`,
    "",
    "YOUR BOOKING DETAILS",
    `Service:       ${booking.service}`,
    `Date:          ${booking.preferredDate}`,
    `Time:          ${booking.preferredTime}`,
    `Registration:  ${booking.registration}`,
    "",
    "Our team will review your request and confirm your appointment shortly.",
    `If you need to make any changes, please call us on ${businessConfig.phone.display}`,
    `or reply to this email.`,
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
  <p>Thanks for submitting your booking request. We'll review it and confirm your appointment shortly.</p>

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
