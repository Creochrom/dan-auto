/**
 * Shared layout for mechanic-first workshop notification emails.
 */

import { formatPhoneDisplay, phoneTelHref } from "@/lib/format-contact";
import { escapeHtml, sanitizePlainText } from "@/lib/utils/sanitize";
import type { BookingFieldChange } from "@/lib/types/booking-events";

export const NOT_PROVIDED = "Not provided";

export function formatWorkshopField(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : NOT_PROVIDED;
}

const SOURCE_LABELS: Record<string, string> = {
  website: "Quick Booking",
  assistant: "AI Advisor",
  admin: "Admin",
  phone: "Phone",
  contact_form: "Contact Form",
  callback: "Callback Request",
  service_detail: "Service Detail Modal",
  ai_advisor: "AI Advisor",
  ai_advisor_booking: "AI Advisor",
  ai_advisor_callback: "AI Advisor — Callback",
  ai_advisor_quote: "AI Advisor — Quote",
};

export function formatWorkshopSourceLabel(
  source: string,
  opts?: { intent?: "book" | "callback" | "quote" | "info_only" | "unspecified" }
): string {
  if (source === "assistant" || source === "ai_advisor") {
    if (opts?.intent === "callback") return SOURCE_LABELS.ai_advisor_callback;
    if (opts?.intent === "quote") return SOURCE_LABELS.ai_advisor_quote;
    return SOURCE_LABELS.ai_advisor;
  }
  return SOURCE_LABELS[source] ?? source;
}

export type WorkshopContactFields = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  registration: string;
  bookingId?: string;
  referenceId?: string;
};

export type WorkshopBookingFields = {
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  sourceLabel: string;
};

function formatWorkshopPhone(phone: string | undefined | null): string {
  const trimmed = phone?.trim();
  if (!trimmed) return NOT_PROVIDED;
  return formatPhoneDisplay(trimmed) || trimmed;
}

function workshopPhoneTelHref(phone: string | undefined | null): string {
  const trimmed = phone?.trim();
  if (!trimmed) return "tel:";
  return phoneTelHref(trimmed);
}

export function renderWorkshopPhoneBannerText(
  customerName: string,
  customerPhone: string,
  customerEmail?: string
): string[] {
  const phone = formatWorkshopPhone(customerPhone);
  const name = formatWorkshopField(customerName);
  const lines = [
    ">>> CALL CUSTOMER <<<",
    `Phone: ${phone}`,
    `Name:  ${name}`,
  ];
  if (customerEmail?.trim()) {
    lines.push(`Email: ${customerEmail.trim()}`);
  }
  lines.push("");
  return lines;
}

export function renderWorkshopIdsText(fields: WorkshopContactFields): string[] {
  const lines: string[] = [];
  if (fields.bookingId?.trim()) {
    lines.push(`Booking ID: ${fields.bookingId.trim()}`);
  } else {
    lines.push(`Booking ID: ${NOT_PROVIDED}`);
  }
  if (fields.referenceId?.trim()) {
    lines.push(`Reference ID: ${fields.referenceId.trim()}`);
  }
  if (lines.length) lines.push("");
  return lines;
}

export function renderWorkshopContactText(fields: WorkshopContactFields): string[] {
  return [
    "CUSTOMER DETAILS",
    `Full name:              ${formatWorkshopField(fields.customerName)}`,
    `Phone number:           ${formatWorkshopPhone(fields.customerPhone)}`,
    `Email:                  ${formatWorkshopField(fields.customerEmail)}`,
    `Vehicle registration:   ${formatWorkshopField(fields.registration)}`,
    "",
  ];
}

export function renderWorkshopBookingText(fields: WorkshopBookingFields): string[] {
  const notes = fields.notes?.trim()
    ? sanitizePlainText(fields.notes, 2000)
    : NOT_PROVIDED;

  return [
    "BOOKING DETAILS",
    `Service:                ${formatWorkshopField(fields.service)}`,
    `Preferred date:         ${formatWorkshopField(fields.preferredDate)}`,
    `Preferred time:         ${formatWorkshopField(fields.preferredTime)}`,
    `Notes:                  ${notes}`,
    `Source:                 ${formatWorkshopField(fields.sourceLabel)}`,
    "",
  ];
}

export function renderWorkshopPhoneBannerHtml(
  customerName: string,
  customerPhone: string,
  customerEmail?: string
): string {
  const phone = formatWorkshopPhone(customerPhone);
  const name = formatWorkshopField(customerName);
  const tel = workshopPhoneTelHref(customerPhone);
  const emailBlock = customerEmail?.trim()
    ? `<p style="margin:10px 0 0;font-size:14px;color:#d4d4d8">
        <span style="color:#a1a1aa">Email:</span>
        <a href="mailto:${escapeHtml(customerEmail.trim())}" style="color:#22d3ee;font-weight:600;text-decoration:none;margin-left:6px">${escapeHtml(customerEmail.trim())}</a>
      </p>`
    : "";

  return `<div style="background:#1a3a1a;border:2px solid #22c55e;border-radius:10px;padding:16px 18px;margin:0 0 20px">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#86efac;text-transform:uppercase">Call customer</p>
    <p style="margin:0;font-size:28px;font-weight:700;line-height:1.2">
      <a href="${escapeHtml(tel)}" style="color:#4ade80;text-decoration:none">${escapeHtml(phone)}</a>
    </p>
    <p style="margin:8px 0 0;font-size:15px;color:#d4d4d8">${escapeHtml(name)}</p>
    ${emailBlock}
  </div>`;
}

export function renderWorkshopIdsHtml(fields: WorkshopContactFields): string {
  const bookingId = fields.bookingId?.trim()
    ? escapeHtml(fields.bookingId.trim())
    : NOT_PROVIDED;
  const ref = fields.referenceId?.trim()
    ? `<span style="color:#71717a"> · Reference: ${escapeHtml(fields.referenceId.trim())}</span>`
    : "";

  return `<p style="margin:0 0 18px;font-size:12px;color:#a1a1aa">
    <strong style="color:#d4a63c">Booking ID:</strong> ${bookingId}${ref}
  </p>`;
}

export function renderWorkshopContactHtml(fields: WorkshopContactFields): string {
  const phone = formatWorkshopPhone(fields.customerPhone);
  const tel = workshopPhoneTelHref(fields.customerPhone);

  return `<h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Customer details</h2>
  <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
    <tr><td style="padding:5px 12px 5px 0;color:#71717a;white-space:nowrap;width:140px">Full name</td><td style="padding:5px 0"><strong>${escapeHtml(formatWorkshopField(fields.customerName))}</strong></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Phone</td><td style="padding:5px 0"><a href="${escapeHtml(tel)}" style="color:#4ade80;font-size:16px;font-weight:600">${escapeHtml(phone)}</a></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Email</td><td style="padding:5px 0">${fields.customerEmail?.trim() ? `<a href="mailto:${escapeHtml(fields.customerEmail.trim())}" style="color:#22d3ee;font-weight:600">${escapeHtml(fields.customerEmail.trim())}</a>` : NOT_PROVIDED}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Registration</td><td style="padding:5px 0"><strong style="font-family:monospace;color:#d4a63c">${escapeHtml(formatWorkshopField(fields.registration))}</strong></td></tr>
  </table>`;
}

export function renderWorkshopBookingHtml(fields: WorkshopBookingFields): string {
  const notes = fields.notes?.trim()
    ? escapeHtml(sanitizePlainText(fields.notes, 2000))
    : NOT_PROVIDED;

  return `<h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Booking details</h2>
  <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
    <tr><td style="padding:5px 12px 5px 0;color:#71717a;width:140px">Service</td><td style="padding:5px 0"><strong>${escapeHtml(formatWorkshopField(fields.service))}</strong></td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Preferred date</td><td style="padding:5px 0">${escapeHtml(formatWorkshopField(fields.preferredDate))}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Preferred time</td><td style="padding:5px 0">${escapeHtml(formatWorkshopField(fields.preferredTime))}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a;vertical-align:top">Notes</td><td style="padding:5px 0">${notes}</td></tr>
    <tr><td style="padding:5px 12px 5px 0;color:#71717a">Source</td><td style="padding:5px 0">${escapeHtml(formatWorkshopField(fields.sourceLabel))}</td></tr>
  </table>`;
}

export function renderWorkshopUpdateBannerText(): string[] {
  return [
    "⚠ BOOKING UPDATED",
    "Customer changed booking details.",
    "Review updated slot below.",
    "",
  ];
}

export function renderWorkshopCancelledBannerText(): string[] {
  return [
    "⚠ BOOKING CANCELLED",
    "This booking was rejected / cancelled.",
    "",
  ];
}

export function renderWorkshopFieldDiffText(changes: readonly BookingFieldChange[]): string[] {
  if (!changes.length) return ["No field changes recorded.", ""];

  const lines: string[] = ["CHANGES", ""];
  for (const change of changes) {
    lines.push(change.label);
    lines.push(`  OLD: ${change.oldValue}`);
    lines.push(`  NEW: ${change.newValue}`);
    lines.push("");
  }
  return lines;
}

export function renderWorkshopUpdateBannerHtml(): string {
  return `<div style="background:#3a2a10;border:2px solid #f59e0b;border-radius:10px;padding:16px 18px;margin:0 0 20px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:#fbbf24;text-transform:uppercase">⚠ Booking updated</p>
    <p style="margin:0;font-size:15px;color:#fde68a;line-height:1.45">Customer changed booking details.</p>
    <p style="margin:8px 0 0;font-size:14px;color:#fcd34d">Review updated slot below.</p>
  </div>`;
}

export function renderWorkshopCancelledBannerHtml(): string {
  return `<div style="background:#3a1010;border:2px solid #ef4444;border-radius:10px;padding:16px 18px;margin:0 0 20px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:#fca5a5;text-transform:uppercase">⚠ Booking cancelled</p>
    <p style="margin:0;font-size:15px;color:#fecaca;line-height:1.45">This booking was rejected / cancelled.</p>
  </div>`;
}

export function renderWorkshopFieldDiffHtml(changes: readonly BookingFieldChange[]): string {
  if (!changes.length) {
    return `<p style="margin:0 0 20px;color:#71717a">No field changes recorded.</p>`;
  }

  const blocks = changes
    .map((change) => {
      const oldVal = escapeHtml(sanitizePlainText(change.oldValue, 500));
      const newVal = escapeHtml(sanitizePlainText(change.newValue, 500));
      return `<div style="margin:0 0 16px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;color:#d4a63c;text-transform:uppercase">${escapeHtml(change.label)}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#71717a"><span style="font-size:10px;font-weight:700;letter-spacing:0.08em">OLD:</span> <span style="text-decoration:line-through">${oldVal}</span></p>
        <p style="margin:0;font-size:15px;color:#4ade80;font-weight:700"><span style="font-size:10px;font-weight:700;letter-spacing:0.08em;color:#86efac">NEW:</span> ${newVal}</p>
      </div>`;
    })
    .join("");

  return `<h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">Changes</h2>${blocks}`;
}
