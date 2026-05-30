/**
 * Workshop notification emails for CRM lead captures.
 */

import { BRAND } from "@/lib/config/brand";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  NOT_PROVIDED,
  renderWorkshopBookingHtml,
  renderWorkshopBookingText,
  renderWorkshopContactHtml,
  renderWorkshopContactText,
  renderWorkshopPhoneBannerHtml,
  renderWorkshopPhoneBannerText,
} from "@/lib/email/templates/workshop-shared";
import { escapeHtml } from "@/lib/utils/sanitize";
import type { Lead } from "@/lib/types/lead";
import type { IntakeIntent } from "@/lib/types/ai-intake";

function buildLeadNotes(lead: Lead): string {
  const parts = [
    lead.problemDescription?.trim() ? lead.problemDescription.trim() : null,
    lead.aiSummary?.trim() ? lead.aiSummary.trim() : null,
  ].filter(Boolean);

  return parts.length ? parts.join("\n\n") : NOT_PROVIDED;
}

function leadIdsText(leadId: string): string[] {
  return [`Lead ID: ${leadId}`, `Booking ID: ${NOT_PROVIDED}`, ""];
}

function leadIdsHtml(leadId: string): string {
  return `<p style="margin:0 0 18px;font-size:12px;color:#a1a1aa">
    <strong style="color:#d4a63c">Lead ID:</strong> ${escapeHtml(leadId)}
    · <span style="color:#71717a">Booking ID: ${NOT_PROVIDED}</span>
  </p>`;
}

export function renderLeadAlertSubject(
  lead: Lead,
  opts?: { sourceIntent?: IntakeIntent }
): string {
  const reg = lead.registration?.replace(/\s/g, "") || "NO-REG";
  const label = formatWorkshopSourceLabel(lead.source, { intent: opts?.sourceIntent });
  return `New Lead — ${reg} — ${label}`;
}

export function renderLeadAlertText(
  lead: Lead,
  opts?: { sourceIntent?: IntakeIntent }
): string {
  const contact = {
    customerName: lead.name,
    customerPhone: lead.phone,
    customerEmail: lead.email,
    registration: lead.registration ?? "",
  };
  const enquiry = {
    service: lead.vehicleModel?.trim() ? `Enquiry — ${lead.vehicleModel.trim()}` : "Customer enquiry",
    preferredDate: lead.preferredDate ?? "",
    preferredTime: "",
    notes: buildLeadNotes(lead),
    sourceLabel: formatWorkshopSourceLabel(lead.source, { intent: opts?.sourceIntent }),
  };

  return [
    `${BRAND.shortName} — New customer lead`,
    "",
    ...renderWorkshopPhoneBannerText(contact.customerName, contact.customerPhone),
    ...leadIdsText(lead.id),
    ...renderWorkshopContactText(contact),
    ...renderWorkshopBookingText(enquiry),
    `Submitted:     ${formatWorkshopField(lead.createdAt)}`,
    "",
    `— ${BRAND.shortName} lead capture`,
  ].join("\n");
}

export function renderLeadAlertHtml(
  lead: Lead,
  opts?: { sourceIntent?: IntakeIntent }
): string {
  const contact = {
    customerName: lead.name,
    customerPhone: lead.phone,
    customerEmail: lead.email,
    registration: lead.registration ?? "",
  };
  const enquiry = {
    service: lead.vehicleModel?.trim() ? `Enquiry — ${lead.vehicleModel.trim()}` : "Customer enquiry",
    preferredDate: lead.preferredDate ?? "",
    preferredTime: "",
    notes: buildLeadNotes(lead),
    sourceLabel: formatWorkshopSourceLabel(lead.source, { intent: opts?.sourceIntent }),
  };

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 16px">New customer lead</h1>

  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone)}
  ${leadIdsHtml(lead.id)}
  ${renderWorkshopContactHtml(contact)}
  ${renderWorkshopBookingHtml(enquiry)}

  <p style="margin:0;font-size:12px;color:#71717a">Submitted: ${escapeHtml(formatWorkshopField(lead.createdAt))}</p>
</body>
</html>`;
}
