import { BRAND } from "@/lib/config/brand";
import { bubbleText } from "@/lib/chat/timeline";
import {
  NOT_PROVIDED,
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
import type { AiIntakeWorkshopSummary } from "@/lib/types/ai-intake";
import type { ChatMessage } from "@/lib/types/chat";

function formatTranscript(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const who = m.role === "user" ? "Customer" : "Advisor";
      const line = bubbleText(m);
      return `[${who}] ${sanitizePlainText(line, 1200)}`;
    })
    .join("\n\n");
}

function formatTranscriptHtml(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const who = m.role === "user" ? "Customer" : "Advisor";
      const line = escapeHtml(sanitizePlainText(bubbleText(m), 1200));
      const color = m.role === "user" ? "#e8d4a8" : "#a1a1aa";
      return `<p style="margin:0 0 10px"><strong style="color:${color}">${who}:</strong> ${line}</p>`;
    })
    .join("");
}

export function buildAiIntakeSubject(summary: AiIntakeWorkshopSummary): string {
  const reg = summary.registration.replace(/\s/g, "") || "NO-REG";
  const flag = summary.urgency === "high" ? "[URGENT] " : "";
  const partial = summary.partial ? " [PARTIAL]" : "";
  const label =
    summary.caseSummary.kind === "callback"
      ? summary.caseSummary.bookingReason ?? summary.serviceRequested
      : summary.serviceRequested;
  return `${flag}New AI Service Intake — ${reg} — ${label}${partial}`;
}

export function renderAiIntakeEmailText(summary: AiIntakeWorkshopSummary): string {
  const contact = {
    customerName: summary.customerName,
    customerPhone: summary.customerPhone,
    customerEmail: summary.customerEmail,
    registration: summary.registration,
    referenceId: summary.chatSessionId,
  };

  const files =
    summary.uploadedFiles.length > 0
      ? summary.uploadedFiles
          .map((f) => `  - ${f.fileName} (${f.category})`)
          .join("\n")
      : `  ${NOT_PROVIDED}`;

  const partialNotice = summary.partial
    ? [
        "*** PARTIAL INTAKE — some fields not collected ***",
        `Missing: ${summary.missingFields.join(", ")}`,
        "Please follow up by phone if needed.",
        "",
      ]
    : [];

  return [
    `${BRAND.shortName} — AI service intake`,
    "",
    ...renderWorkshopPhoneBannerText(contact.customerName, contact.customerPhone),
    ...renderWorkshopIdsText(contact),
    ...partialNotice,
    ...renderWorkshopCaseBriefText(summary.caseSummary),
    "-----------------------------------",
    "Uploaded Files",
    "-----------------------------------",
    files,
    "",
    "-----------------------------------",
    "Conversation transcript (reference only)",
    "-----------------------------------",
    summary.transcript.length ? formatTranscript(summary.transcript) : NOT_PROVIDED,
    "",
    `Prepared: ${summary.preparedAt}`,
  ].join("\n");
}

export function renderAiIntakeEmailHtml(summary: AiIntakeWorkshopSummary): string {
  const contact = {
    customerName: summary.customerName,
    customerPhone: summary.customerPhone,
    customerEmail: summary.customerEmail,
    registration: summary.registration,
    referenceId: summary.chatSessionId,
  };

  const uploads = summary.uploadedFiles
    .map(
      (f) =>
        `<li>${escapeHtml(f.fileName)} <span style="color:#888">(${escapeHtml(f.category)})</span></li>`
    )
    .join("");

  const partialBanner = summary.partial
    ? `<div style="background:#3a1a1a;border:1px solid #6b2a2a;color:#f5c6c6;padding:12px 14px;border-radius:8px;margin:0 0 18px;font-size:13px">
        <strong style="color:#ff9090">Partial intake</strong> — please follow up by phone.
        <div style="color:#e2a4a4;margin-top:4px">Missing: ${summary.missingFields.map(escapeHtml).join(", ")}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;line-height:1.5;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 8px">New AI Service Intake</h1>

  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone)}
  ${renderWorkshopIdsHtml(contact)}
  ${partialBanner}
  ${renderWorkshopCaseBriefHtml(summary.caseSummary)}

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Uploaded files</h2>
  <ul>${uploads || `<li>${NOT_PROVIDED}</li>`}</ul>

  <h2 style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Conversation transcript (reference only)</h2>
  <div style="background:#111;padding:14px;border-radius:8px;font-size:13px;max-height:360px;overflow:auto">
    ${summary.transcript.length ? formatTranscriptHtml(summary.transcript) : `<p>${NOT_PROVIDED}</p>`}
  </div>

  <p style="margin:20px 0 0;font-size:11px;color:#52525b">Prepared: ${escapeHtml(summary.preparedAt)}</p>
</body>
</html>`;
}
