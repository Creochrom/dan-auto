import { BRAND } from "@/lib/config/brand";
import { escapeHtml, sanitizePlainText } from "@/lib/utils/sanitize";
import type { AiIntakeWorkshopSummary } from "@/lib/types/ai-intake";
import type { ChatMessage } from "@/lib/types/chat";
import { bubbleText } from "@/lib/chat/timeline";

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
  return `New AI Service Intake — ${reg} — ${summary.serviceRequested}`;
}

export function renderAiIntakeEmailText(summary: AiIntakeWorkshopSummary): string {
  const files =
    summary.uploadedFiles.length > 0
      ? summary.uploadedFiles
          .map((f) => `  - ${f.fileName} (${f.category})`)
          .join("\n")
      : "  (none)";

  const booking = summary.bookingPreference
    ? `${summary.bookingPreference.service} · ${summary.bookingPreference.preferredDate} at ${summary.bookingPreference.preferredTime}`
    : "Not selected (advisor-only intake)";

  const observations =
    summary.observations.length > 0
      ? summary.observations.map((o) => `  - ${o}`).join("\n")
      : "  (none)";

  return [
    `${BRAND.shortName} — AI service intake`,
    `Session: ${summary.chatSessionId}`,
    `Prepared: ${summary.preparedAt}`,
    "",
    "-----------------------------------",
    "Customer Details",
    "-----------------------------------",
    `Name: ${summary.customerName}`,
    `Phone: ${summary.customerPhone}`,
    `Email: ${summary.customerEmail ?? "—"}`,
    "",
    "-----------------------------------",
    "Vehicle",
    "-----------------------------------",
    `Registration: ${summary.registration}`,
    `Service requested: ${summary.serviceRequested}`,
    `Make/model: ${summary.vehicle ?? "—"}`,
    "",
    "-----------------------------------",
    "Issue Summary",
    "-----------------------------------",
    summary.symptoms,
    "",
    "-----------------------------------",
    "AI Intake Notes",
    "-----------------------------------",
    `Possible causes: ${summary.possibleCauses.join(", ") || "—"}`,
    `Urgency: ${summary.urgency}`,
    `Severity: ${summary.severity ?? "—"}`,
    `Guidance range discussed: ${summary.estimatedRange ?? "—"}`,
    `Severity note: ${summary.severityNote ?? "—"}`,
    `Callback requested: ${summary.callbackRequested ? "Yes" : "No"}`,
    "",
    "Observations:",
    observations,
    "",
    "Clarifications:",
    summary.clarificationNotes.length
      ? summary.clarificationNotes.map((n) => `  - ${n}`).join("\n")
      : "  (none)",
    "",
    "-----------------------------------",
    "Booking Preference",
    "-----------------------------------",
    booking,
    `Callback availability: ${summary.callbackAvailability ?? "—"}`,
    "",
    "-----------------------------------",
    "Uploaded Files",
    "-----------------------------------",
    files,
    "",
    "-----------------------------------",
    "Conversation Transcript",
    "-----------------------------------",
    formatTranscript(summary.transcript),
  ].join("\n");
}

export function renderAiIntakeEmailHtml(summary: AiIntakeWorkshopSummary): string {
  const s = summary;
  const causes = s.possibleCauses.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const uploads = s.uploadedFiles
    .map(
      (f) =>
        `<li>${escapeHtml(f.fileName)} <span style="color:#888">(${escapeHtml(f.category)})</span></li>`
    )
    .join("");
  const obs = s.observations
    .map((o) => `<li>${escapeHtml(o)}</li>`)
    .join("");
  const clar = s.clarificationNotes
    .map((n) => `<li>${escapeHtml(n)}</li>`)
    .join("");

  const booking = s.bookingPreference
    ? `<p>${escapeHtml(s.bookingPreference.service)} · ${escapeHtml(s.bookingPreference.preferredDate)} at ${escapeHtml(s.bookingPreference.preferredTime)}</p>`
    : `<p style="color:#888">Advisor-only intake (no slot selected)</p>`;

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;line-height:1.5">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 8px">New AI Service Intake</h1>
  <p style="color:#888;font-size:12px;margin:0 0 20px">${escapeHtml(BRAND.shortName)} · ${escapeHtml(s.chatSessionId)}</p>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Customer Details</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:4px 0;color:#888;width:120px">Name</td><td>${escapeHtml(s.customerName)}</td></tr>
    <tr><td style="padding:4px 0;color:#888">Phone</td><td>${escapeHtml(s.customerPhone)}</td></tr>
    <tr><td style="padding:4px 0;color:#888">Email</td><td>${escapeHtml(s.customerEmail ?? "—")}</td></tr>
  </table>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Vehicle</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:4px 0;color:#888;width:120px">Registration</td><td><strong>${escapeHtml(s.registration)}</strong></td></tr>
    <tr><td style="padding:4px 0;color:#888">Service</td><td>${escapeHtml(s.serviceRequested)}</td></tr>
    <tr><td style="padding:4px 0;color:#888">Make/model</td><td>${escapeHtml(s.vehicle ?? "—")}</td></tr>
  </table>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Issue Summary</h2>
  <p style="background:#111;padding:12px;border-radius:8px">${escapeHtml(s.symptoms)}</p>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">AI Intake Notes</h2>
  <ul>${causes || "<li>—</li>"}</ul>
  <p><strong>Urgency:</strong> ${escapeHtml(s.urgency)} · <strong>Severity:</strong> ${escapeHtml(s.severity ?? "—")}</p>
  <p><strong>Guidance range:</strong> ${escapeHtml(s.estimatedRange ?? "—")} <span style="color:#888">(indicative)</span></p>
  <p style="color:#aaa;font-size:13px">${escapeHtml(s.severityNote ?? "")}</p>
  <p><strong>Observations</strong></p>
  <ul>${obs || "<li>—</li>"}</ul>
  <p><strong>Clarifications</strong></p>
  <ul>${clar || "<li>—</li>"}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Booking Preference</h2>
  ${booking}
  <p><strong>Callback:</strong> ${escapeHtml(s.callbackAvailability ?? "—")}</p>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Uploaded Files</h2>
  <ul>${uploads || "<li>None</li>"}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Conversation Transcript</h2>
  <div style="background:#111;padding:14px;border-radius:8px;font-size:13px;max-height:480px;overflow:auto">
    ${formatTranscriptHtml(s.transcript)}
  </div>
</body>
</html>`;
}
