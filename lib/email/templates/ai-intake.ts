import { BRAND } from "@/lib/config/brand";
import { bubbleText } from "@/lib/chat/timeline";
import {
  formatWorkshopField,
  formatWorkshopSourceLabel,
  NOT_PROVIDED,
  renderWorkshopBookingHtml,
  renderWorkshopBookingText,
  renderWorkshopContactHtml,
  renderWorkshopContactText,
  renderWorkshopIdsHtml,
  renderWorkshopIdsText,
  renderWorkshopPhoneBannerHtml,
  renderWorkshopPhoneBannerText,
} from "@/lib/email/templates/workshop-shared";
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

const DRIVABILITY_LABEL: Record<AiIntakeWorkshopSummary["drivability"], string> = {
  drives_normally: "Drives normally",
  drivable_with_concern: "Drivable — customer has concerns",
  avoid_driving: "Avoid driving — safety risk",
  will_not_start: "Will not start / stranded",
  unknown: "Not confirmed",
};

const INTENT_LABEL: Record<AiIntakeWorkshopSummary["intent"], string> = {
  book: "Wants to book a workshop slot",
  callback: "Wants a callback from the workshop",
  quote: "Wants an indicative quote first",
  info_only: "General enquiry — not committing yet",
  unspecified: "Not yet stated",
};

function buildAiIntakeNotes(summary: AiIntakeWorkshopSummary): string {
  const parts = [
    summary.symptoms?.trim() ? summary.symptoms.trim() : null,
    summary.aiSummary?.trim() ? `AI summary: ${summary.aiSummary.trim()}` : null,
    summary.callbackRequested ? "Customer requested a callback." : null,
    summary.drivabilityNote?.trim() ? summary.drivabilityNote.trim() : null,
  ].filter(Boolean);

  return parts.length ? parts.join("\n\n") : NOT_PROVIDED;
}

function buildAiIntakeBookingFields(summary: AiIntakeWorkshopSummary) {
  return {
    service: summary.serviceRequested,
    preferredDate:
      summary.bookingPreference?.preferredDate ??
      summary.preferredBookingTime ??
      summary.callbackAvailability ??
      "",
    preferredTime: summary.bookingPreference?.preferredTime ?? "",
    notes: buildAiIntakeNotes(summary),
    sourceLabel: formatWorkshopSourceLabel("assistant", { intent: summary.intent }),
  };
}

export function buildAiIntakeSubject(summary: AiIntakeWorkshopSummary): string {
  const reg = summary.registration.replace(/\s/g, "") || "NO-REG";
  const flag = summary.urgency === "high" ? "[URGENT] " : "";
  const partial = summary.partial ? " [PARTIAL]" : "";
  return `${flag}New AI Service Intake — ${reg} — ${summary.serviceRequested}${partial}`;
}

export function renderAiIntakeEmailText(summary: AiIntakeWorkshopSummary): string {
  const contact = {
    customerName: summary.customerName,
    customerPhone: summary.customerPhone,
    customerEmail: summary.customerEmail,
    registration: summary.registration,
    referenceId: summary.chatSessionId,
  };
  const bookingDetails = buildAiIntakeBookingFields(summary);

  const files =
    summary.uploadedFiles.length > 0
      ? summary.uploadedFiles
          .map((f) => `  - ${f.fileName} (${f.category})`)
          .join("\n")
      : `  ${NOT_PROVIDED}`;

  const observations =
    summary.observations.length > 0
      ? summary.observations.map((o) => `  - ${o}`).join("\n")
      : `  ${NOT_PROVIDED}`;

  const warningLights =
    summary.warningLights.length > 0
      ? summary.warningLights.map((w) => `  - ${w}`).join("\n")
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
    ...renderWorkshopContactText(contact),
    ...renderWorkshopBookingText(bookingDetails),
    ...partialNotice,
    "-----------------------------------",
    "AI Summary (read first)",
    "-----------------------------------",
    summary.aiSummary || NOT_PROVIDED,
    "",
    `Intent: ${INTENT_LABEL[summary.intent]}`,
    `Urgency: ${summary.urgency}`,
    `Drivability: ${DRIVABILITY_LABEL[summary.drivability]}${
      summary.drivabilityNote ? ` — ${summary.drivabilityNote}` : ""
    }`,
    "",
    "-----------------------------------",
    "Issue Description",
    "-----------------------------------",
    formatWorkshopField(summary.symptoms),
    "",
    "Warning lights on dashboard:",
    warningLights,
    "",
    "-----------------------------------",
    "AI Intake Notes",
    "-----------------------------------",
    `Possible causes: ${summary.possibleCauses.join(", ") || NOT_PROVIDED}`,
    `Severity: ${formatWorkshopField(summary.severity)}`,
    `Guidance range discussed: ${formatWorkshopField(summary.estimatedRange)}`,
    `Severity note: ${formatWorkshopField(summary.severityNote)}`,
    "",
    "Observations:",
    observations,
    "",
    "Clarifications:",
    summary.clarificationNotes.length
      ? summary.clarificationNotes.map((n) => `  - ${n}`).join("\n")
      : `  ${NOT_PROVIDED}`,
    "",
    "-----------------------------------",
    "Uploaded Files",
    "-----------------------------------",
    files,
    "",
    "-----------------------------------",
    "Conversation Transcript",
    "-----------------------------------",
    summary.transcript.length ? formatTranscript(summary.transcript) : NOT_PROVIDED,
    "",
    `Prepared: ${summary.preparedAt}`,
  ].join("\n");
}

export function renderAiIntakeEmailHtml(summary: AiIntakeWorkshopSummary): string {
  const s = summary;
  const contact = {
    customerName: s.customerName,
    customerPhone: s.customerPhone,
    customerEmail: s.customerEmail,
    registration: s.registration,
    referenceId: s.chatSessionId,
  };
  const bookingDetails = buildAiIntakeBookingFields(s);

  const causes = s.possibleCauses.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const lights = s.warningLights.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
  const uploads = s.uploadedFiles
    .map(
      (f) =>
        `<li>${escapeHtml(f.fileName)} <span style="color:#888">(${escapeHtml(f.category)})</span></li>`
    )
    .join("");
  const obs = s.observations.map((o) => `<li>${escapeHtml(o)}</li>`).join("");
  const clar = s.clarificationNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  const partialBanner = s.partial
    ? `<div style="background:#3a1a1a;border:1px solid #6b2a2a;color:#f5c6c6;padding:12px 14px;border-radius:8px;margin:0 0 18px;font-size:13px">
        <strong style="color:#ff9090">Partial intake</strong> — please follow up by phone.
        <div style="color:#e2a4a4;margin-top:4px">Missing: ${s.missingFields.map(escapeHtml).join(", ")}</div>
      </div>`
    : "";

  const urgencyBadgeBg =
    s.urgency === "high" ? "#5a1f1f" : s.urgency === "medium" ? "#5a4520" : "#1f3a1f";
  const urgencyBadgeColor =
    s.urgency === "high" ? "#ff9090" : s.urgency === "medium" ? "#f0c97b" : "#9ad29a";

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;line-height:1.5;max-width:600px">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 8px">New AI Service Intake</h1>

  ${renderWorkshopPhoneBannerHtml(contact.customerName, contact.customerPhone)}
  ${renderWorkshopIdsHtml(contact)}
  ${renderWorkshopContactHtml(contact)}
  ${renderWorkshopBookingHtml(bookingDetails)}

  ${partialBanner}

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">AI Summary</h2>
  <p style="background:#141414;border-left:3px solid #d4a63c;padding:12px 14px;border-radius:6px;margin:0 0 14px">
    ${escapeHtml(s.aiSummary || NOT_PROVIDED)}
  </p>
  <p style="margin:0 0 18px">
    <span style="display:inline-block;background:${urgencyBadgeBg};color:${urgencyBadgeColor};padding:3px 10px;border-radius:99px;font-size:12px;margin-right:6px">Urgency: ${escapeHtml(s.urgency)}</span>
    <span style="display:inline-block;background:#1a1a1a;color:#ddd;padding:3px 10px;border-radius:99px;font-size:12px;margin-right:6px">Intent: ${escapeHtml(INTENT_LABEL[s.intent])}</span>
    <span style="display:inline-block;background:#1a1a1a;color:#ddd;padding:3px 10px;border-radius:99px;font-size:12px">Drivability: ${escapeHtml(DRIVABILITY_LABEL[s.drivability])}</span>
  </p>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Issue Description</h2>
  <p style="background:#111;padding:12px;border-radius:8px;margin:0 0 12px">${escapeHtml(formatWorkshopField(s.symptoms))}</p>
  <p style="margin:0 0 6px;color:#bbb;font-size:13px"><strong>Warning lights on dashboard:</strong></p>
  <ul style="margin:0 0 12px">${lights || `<li style="color:#888">${NOT_PROVIDED}</li>`}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">AI Intake Notes</h2>
  <ul>${causes || `<li>${NOT_PROVIDED}</li>`}</ul>
  <p><strong>Severity:</strong> ${escapeHtml(formatWorkshopField(s.severity))}</p>
  <p><strong>Guidance range:</strong> ${escapeHtml(formatWorkshopField(s.estimatedRange))} <span style="color:#888">(indicative)</span></p>
  <p><strong>Observations</strong></p>
  <ul>${obs || `<li>${NOT_PROVIDED}</li>`}</ul>
  <p><strong>Clarifications</strong></p>
  <ul>${clar || `<li>${NOT_PROVIDED}</li>`}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Uploaded Files</h2>
  <ul>${uploads || `<li>${NOT_PROVIDED}</li>`}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Conversation Transcript</h2>
  <div style="background:#111;padding:14px;border-radius:8px;font-size:13px;max-height:480px;overflow:auto">
    ${s.transcript.length ? formatTranscriptHtml(s.transcript) : `<p>${NOT_PROVIDED}</p>`}
  </div>

  <p style="margin:20px 0 0;font-size:11px;color:#52525b">Prepared: ${escapeHtml(s.preparedAt)}</p>
</body>
</html>`;
}
