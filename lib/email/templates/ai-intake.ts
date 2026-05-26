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

export function buildAiIntakeSubject(summary: AiIntakeWorkshopSummary): string {
  const reg = summary.registration.replace(/\s/g, "") || "NO-REG";
  const flag = summary.urgency === "high" ? "[URGENT] " : "";
  const partial = summary.partial ? " [PARTIAL]" : "";
  return `${flag}New AI Service Intake — ${reg} — ${summary.serviceRequested}${partial}`;
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

  const warningLights =
    summary.warningLights.length > 0
      ? summary.warningLights.map((w) => `  - ${w}`).join("\n")
      : "  (none reported)";

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
    `Session: ${summary.chatSessionId}`,
    `Prepared: ${summary.preparedAt}`,
    "",
    ...partialNotice,
    "-----------------------------------",
    "AI Summary (read first)",
    "-----------------------------------",
    summary.aiSummary || "(AI did not produce a narrative summary — see issue description below)",
    "",
    `Intent: ${INTENT_LABEL[summary.intent]}`,
    `Urgency: ${summary.urgency}`,
    `Drivability: ${DRIVABILITY_LABEL[summary.drivability]}${
      summary.drivabilityNote ? ` — ${summary.drivabilityNote}` : ""
    }`,
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
    "Issue Description",
    "-----------------------------------",
    summary.symptoms,
    "",
    "Warning lights on dashboard:",
    warningLights,
    "",
    "-----------------------------------",
    "AI Intake Notes",
    "-----------------------------------",
    `Possible causes: ${summary.possibleCauses.join(", ") || "—"}`,
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
    "Booking / Callback",
    "-----------------------------------",
    `Preferred slot (customer): ${summary.preferredBookingTime ?? "—"}`,
    `Booking form selection: ${booking}`,
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
  const lights = s.warningLights.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
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
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px;line-height:1.5">
  <h1 style="color:#d4a63c;font-size:18px;margin:0 0 8px">New AI Service Intake</h1>
  <p style="color:#888;font-size:12px;margin:0 0 20px">${escapeHtml(BRAND.shortName)} · ${escapeHtml(s.chatSessionId)}</p>

  ${partialBanner}

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">AI Summary</h2>
  <p style="background:#141414;border-left:3px solid #d4a63c;padding:12px 14px;border-radius:6px;margin:0 0 14px">
    ${escapeHtml(s.aiSummary || "(AI did not produce a narrative — see issue description below)")}
  </p>
  <p style="margin:0 0 18px">
    <span style="display:inline-block;background:${urgencyBadgeBg};color:${urgencyBadgeColor};padding:3px 10px;border-radius:99px;font-size:12px;margin-right:6px">Urgency: ${escapeHtml(s.urgency)}</span>
    <span style="display:inline-block;background:#1a1a1a;color:#ddd;padding:3px 10px;border-radius:99px;font-size:12px;margin-right:6px">Intent: ${escapeHtml(INTENT_LABEL[s.intent])}</span>
    <span style="display:inline-block;background:#1a1a1a;color:#ddd;padding:3px 10px;border-radius:99px;font-size:12px">Drivability: ${escapeHtml(DRIVABILITY_LABEL[s.drivability])}</span>
  </p>
  ${s.drivabilityNote ? `<p style="color:#aaa;font-size:13px;margin:-6px 0 14px">${escapeHtml(s.drivabilityNote)}</p>` : ""}

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

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Issue Description</h2>
  <p style="background:#111;padding:12px;border-radius:8px;margin:0 0 12px">${escapeHtml(s.symptoms)}</p>
  <p style="margin:0 0 6px;color:#bbb;font-size:13px"><strong>Warning lights on dashboard:</strong></p>
  <ul style="margin:0 0 12px">${lights || `<li style="color:#888">None reported</li>`}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">AI Intake Notes</h2>
  <p style="margin:0 0 4px;color:#bbb;font-size:13px"><strong>Possible causes:</strong></p>
  <ul>${causes || "<li>—</li>"}</ul>
  <p><strong>Severity:</strong> ${escapeHtml(s.severity ?? "—")}</p>
  <p><strong>Guidance range:</strong> ${escapeHtml(s.estimatedRange ?? "—")} <span style="color:#888">(indicative)</span></p>
  <p style="color:#aaa;font-size:13px">${escapeHtml(s.severityNote ?? "")}</p>
  <p><strong>Observations</strong></p>
  <ul>${obs || "<li>—</li>"}</ul>
  <p><strong>Clarifications</strong></p>
  <ul>${clar || "<li>—</li>"}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Booking / Callback</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:4px 0;color:#888;width:200px">Preferred slot (customer)</td><td>${escapeHtml(s.preferredBookingTime ?? "—")}</td></tr>
    <tr><td style="padding:4px 0;color:#888">Booking form selection</td><td>${
      s.bookingPreference
        ? `${escapeHtml(s.bookingPreference.service)} · ${escapeHtml(s.bookingPreference.preferredDate)} at ${escapeHtml(s.bookingPreference.preferredTime)}`
        : `<span style="color:#888">None selected</span>`
    }</td></tr>
    <tr><td style="padding:4px 0;color:#888">Callback availability</td><td>${escapeHtml(s.callbackAvailability ?? "—")}</td></tr>
  </table>
  ${booking === "" ? "" : ""}

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Uploaded Files</h2>
  <ul>${uploads || "<li>None</li>"}</ul>

  <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 8px">Conversation Transcript</h2>
  <div style="background:#111;padding:14px;border-radius:8px;font-size:13px;max-height:480px;overflow:auto">
    ${formatTranscriptHtml(s.transcript)}
  </div>
</body>
</html>`;
}
