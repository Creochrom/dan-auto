/**
 * Workshop emails when an existing booking is updated or cancelled.
 */

import { BRAND } from "@/lib/config/brand";
import {
  formatBookingDateDisplay,
  formatRegistrationForSubject,
} from "@/lib/booking/format-booking-display";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  renderWorkshopBookingHtml,
  renderWorkshopBookingText,
  renderWorkshopCancelledBannerHtml,
  renderWorkshopCancelledBannerText,
  renderWorkshopContactHtml,
  renderWorkshopContactText,
  renderWorkshopFieldDiffHtml,
  renderWorkshopFieldDiffText,
  renderWorkshopIdsHtml,
  renderWorkshopIdsText,
  renderWorkshopPhoneBannerHtml,
  renderWorkshopPhoneBannerText,
  renderWorkshopUpdateBannerHtml,
  renderWorkshopUpdateBannerText,
} from "@/lib/email/templates/workshop-shared";
import { escapeHtml } from "@/lib/utils/sanitize";
import type { Booking } from "@/lib/types/booking";
import type { BookingFieldChange } from "@/lib/types/booking-events";

function contactFields(booking: Booking) {
  return {
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    registration: booking.registration,
    bookingId: booking.id,
  };
}

function bookingFields(booking: Booking) {
  return {
    service: booking.service,
    preferredDate: formatBookingDateDisplay(booking.preferredDate),
    preferredTime: booking.preferredTime,
    notes: booking.notes,
    sourceLabel: formatWorkshopSourceLabel(booking.source),
  };
}

export function renderWorkshopUpdatedSubject(booking: Booking): string {
  const reg = formatRegistrationForSubject(booking.registration);
  return `UPDATED Booking – ${reg}`;
}

export function renderWorkshopCancelledSubject(booking: Booking): string {
  const reg = formatRegistrationForSubject(booking.registration);
  return `CANCELLED Booking – ${reg}`;
}

export function renderWorkshopUpdatedText(
  booking: Booking,
  changes: readonly BookingFieldChange[]
): string {
  const contact = contactFields(booking);
  const details = bookingFields(booking);

  return [
    `${BRAND.shortName} — Booking Updated`,
    "",
    ...renderWorkshopUpdateBannerText(),
    ...renderWorkshopPhoneBannerText(
      contact.customerName,
      contact.customerPhone,
      contact.customerEmail
    ),
    ...renderWorkshopIdsText(contact),
    ...renderWorkshopFieldDiffText(changes),
    ...renderWorkshopContactText(contact),
    ...renderWorkshopBookingText(details),
    `Updated:       ${formatWorkshopField(booking.updatedAt)}`,
    "",
    `— ${BRAND.shortName} booking system`,
  ].join("\n");
}

export function renderWorkshopUpdatedHtml(
  booking: Booking,
  changes: readonly BookingFieldChange[]
): string {
  const contact = contactFields(booking);
  const details = bookingFields(booking);

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 16px">Booking Updated</h1>

  ${renderWorkshopUpdateBannerHtml()}
  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone, contact.customerEmail)}
  ${renderWorkshopIdsHtml(contact)}
  ${renderWorkshopFieldDiffHtml(changes)}
  ${renderWorkshopContactHtml(contact)}
  ${renderWorkshopBookingHtml(details)}

  <p style="margin:0;font-size:12px;color:#71717a">Updated: ${escapeHtml(formatWorkshopField(booking.updatedAt))}</p>
</body>
</html>`;
}

export function renderWorkshopCancelledText(
  booking: Booking,
  changes: readonly BookingFieldChange[]
): string {
  const contact = contactFields(booking);
  const details = bookingFields(booking);

  return [
    `${BRAND.shortName} — Booking Cancelled`,
    "",
    ...renderWorkshopCancelledBannerText(),
    ...renderWorkshopPhoneBannerText(
      contact.customerName,
      contact.customerPhone,
      contact.customerEmail
    ),
    ...renderWorkshopIdsText(contact),
    ...(changes.length ? renderWorkshopFieldDiffText(changes) : []),
    ...renderWorkshopContactText(contact),
    ...renderWorkshopBookingText(details),
    `Updated:       ${formatWorkshopField(booking.updatedAt)}`,
    "",
    `— ${BRAND.shortName} booking system`,
  ].join("\n");
}

export function renderWorkshopCancelledHtml(
  booking: Booking,
  changes: readonly BookingFieldChange[]
): string {
  const contact = contactFields(booking);
  const details = bookingFields(booking);
  const diff = changes.length ? renderWorkshopFieldDiffHtml(changes) : "";

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 16px">Booking Cancelled</h1>

  ${renderWorkshopCancelledBannerHtml()}
  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone, contact.customerEmail)}
  ${renderWorkshopIdsHtml(contact)}
  ${diff}
  ${renderWorkshopContactHtml(contact)}
  ${renderWorkshopBookingHtml(details)}

  <p style="margin:0;font-size:12px;color:#71717a">Updated: ${escapeHtml(formatWorkshopField(booking.updatedAt))}</p>
</body>
</html>`;
}
