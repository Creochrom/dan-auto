import { BRAND } from "@/lib/config/brand";
import { bubbleText } from "@/lib/chat/timeline";
import type { ChatMessage } from "@/lib/types/chat";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";
import { escapeHtml, sanitizePlainText } from "@/lib/utils/sanitize";

function line(label: string, value: string) {
  return `${label}: ${value}`;
}

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
  transcript?: ChatMessage[]
): string {
  const files =
    summary.uploadedFiles.length > 0
      ? summary.uploadedFiles.map((f) => `  - ${f.fileName} (${f.category})`).join("\n")
      : "  (none)";

  return [
    `${BRAND.shortName} — new booking intake`,
    "",
    line("Customer", summary.customerName),
    line("Phone", summary.customerPhone),
    line("Registration", summary.registration),
    line("Vehicle", summary.vehicle ?? "—"),
    "",
    "BOOKING SLOT",
    line("Service", summary.bookingSlot.service),
    line("Date", summary.bookingSlot.preferredDate),
    line("Time", summary.bookingSlot.preferredTime),
    "",
    "VEHICLE REPORT",
    line("Symptoms", summary.symptoms),
    line("Possible causes", summary.possibleCauses.join(", ") || "—"),
    line("Indicative range", summary.estimatedRange ?? "—"),
    line("Urgency", summary.urgency),
    line("Severity", summary.severity ?? "—"),
    line("Callback window", summary.callbackAvailability ?? "—"),
    "",
    "UPLOADS",
    files,
    "",
    "-----------------------------------",
    "Conversation Transcript",
    "-----------------------------------",
    transcript?.length ? formatTranscriptText(transcript) : "(see workshop system)",
    "",
    `— ${BRAND.shortName} booking intake`,
  ].join("\n");
}

export function renderBookingIntakeEmailHtml(
  summary: ServiceIntakeSummary,
  transcript?: ChatMessage[]
): string {
  const causes = summary.possibleCauses.map((c) => `<li>${c}</li>`).join("");
  const uploads = summary.uploadedFiles
    .map((f) => `<li>${f.fileName} <span style="color:#888">(${f.category})</span></li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:24px">
  <h1 style="color:#d4a63c;font-size:18px">New booking intake</h1>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:6px 0;color:#888">Customer</td><td>${summary.customerName}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Phone</td><td>${summary.customerPhone}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Registration</td><td><strong>${summary.registration}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#888">Vehicle</td><td>${summary.vehicle ?? "—"}</td></tr>
  </table>
  <h2 style="font-size:14px;color:#d4a63c">Slot</h2>
  <p>${summary.bookingSlot.service} · ${summary.bookingSlot.preferredDate} at ${summary.bookingSlot.preferredTime}</p>
  <h2 style="font-size:14px;color:#d4a63c">Symptoms</h2>
  <p>${summary.symptoms}</p>
  <ul>${causes}</ul>
  <p><strong>Indicative range:</strong> ${summary.estimatedRange ?? "—"} (not a fixed quote)</p>
  <p><strong>Urgency:</strong> ${summary.urgency} · <strong>Callback:</strong> ${summary.callbackAvailability ?? "—"}</p>
  <h2 style="font-size:14px;color:#d4a63c">Uploads</h2>
  <ul>${uploads || "<li>None</li>"}</ul>
  <h2 style="font-size:14px;color:#d4a63c">Conversation Transcript</h2>
  <div style="background:#111;padding:12px;border-radius:8px;font-size:13px;max-height:400px;overflow:auto">
    ${transcript?.length ? formatTranscriptHtml(transcript) : "<p>—</p>"}
  </div>
</body>
</html>`;
}
