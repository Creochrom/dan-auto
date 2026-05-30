import { BRAND } from "@/lib/config/brand";
import { bubbleText } from "@/lib/chat/timeline";
import type { ChatMessage } from "@/lib/types/chat";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  NOT_PROVIDED,
  renderWorkshopContactHtml,
  renderWorkshopContactText,
  renderWorkshopIdsHtml,
  renderWorkshopIdsText,
  renderWorkshopPhoneBannerHtml,
  renderWorkshopPhoneBannerText,
} from "@/lib/email/templates/workshop-shared";
import {
  renderWorkshopCaseBriefHtml,
  renderWorkshopCaseBriefText,
} from "@/lib/email/templates/workshop-case-brief";
import { escapeHtml, sanitizePlainText } from "@/lib/utils/sanitize";

function formatTranscriptText(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const who = m.role === "user" ? "Customer" : "Advisor";
      return `[${who}] ${sanitizePlainText(bubbleText(m), 1200)}`;
    })
    .join("\n\n");
}

function formatTranscriptHtml(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const who = m.role === "user" ? "Customer" : "Advisor";
      const line = escapeHtml(sanitizePlainText(bubbleText(m), 1200));
      return `<p style="margin:0 0 8px"><strong>${who}:</strong> ${line}</p>`;
    })
    .join("");
}

export function renderBookingIntakeEmailText(
  summary: ServiceIntakeSummary,
  opts?: { transcript?: ChatMessage[]; bookingId?: string; customerEmail?: string }
): string {
  const contact = {
    customerName: summary.customerName,
    customerPhone: summary.customerPhone,
    customerEmail: opts?.customerEmail,
    registration: summary.registration,
    bookingId: opts?.bookingId,
    referenceId: summary.chatSessionId,
  };

  const files =
    summary.uploadedFiles.length > 0
      ? summary.uploadedFiles.map((f) => `  - ${f.fileName} (${f.category})`).join("\n")
      : `  ${NOT_PROVIDED}`;

  return [
    `${BRAND.shortName} — New AI Service Intake`,
    "",
    ...renderWorkshopPhoneBannerText(
      contact.customerName,
      contact.customerPhone,
      contact.customerEmail
    ),
    ...renderWorkshopIdsText(contact),
    ...renderWorkshopCaseBriefText(summary.caseSummary),
    `Source: ${formatWorkshopSourceLabel("ai_advisor")}`,
    "",
    "UPLOADS",
    files,
    "",
    "-----------------------------------",
    "Conversation transcript (reference only)",
    "-----------------------------------",
    opts?.transcript?.length ? formatTranscriptText(opts.transcript) : NOT_PROVIDED,
    "",
    `— ${BRAND.shortName} booking intake`,
  ].join("\n");
}

export function renderBookingIntakeEmailHtml(
  summary: ServiceIntakeSummary,
  opts?: { transcript?: ChatMessage[]; bookingId?: string; customerEmail?: string }
): string {
  const contact = {
    customerName: summary.customerName,
    customerPhone: summary.customerPhone,
    customerEmail: opts?.customerEmail,
    registration: summary.registration,
    bookingId: opts?.bookingId,
    referenceId: summary.chatSessionId,
  };

  const uploads = summary.uploadedFiles
    .map(
      (f) =>
        `<li>${escapeHtml(f.fileName)} <span style="color:#888">(${escapeHtml(f.category)})</span></li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 16px">New AI Service Intake</h1>

  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone, contact.customerEmail)}
  ${renderWorkshopIdsHtml(contact)}
  ${renderWorkshopContactHtml(contact)}
  ${renderWorkshopCaseBriefHtml(summary.caseSummary)}

  <p style="margin:0 0 20px;font-size:12px;color:#71717a">
    Source: ${escapeHtml(formatWorkshopSourceLabel("ai_advisor"))}
  </p>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Uploads</h2>
  <ul style="margin:0 0 20px">${uploads || `<li>${NOT_PROVIDED}</li>`}</ul>

  <h2 style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Conversation transcript (reference only)</h2>
  <div style="background:#111;padding:12px;border-radius:8px;font-size:13px;max-height:360px;overflow:auto">
    ${opts?.transcript?.length ? formatTranscriptHtml(opts.transcript) : `<p>${NOT_PROVIDED}</p>`}
  </div>
</body>
</html>`;
}
