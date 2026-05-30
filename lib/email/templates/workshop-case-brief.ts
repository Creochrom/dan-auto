import type { IntakeDrivability } from "@/lib/types/ai-intake";
import type { WorkshopCaseKind, WorkshopCaseSummary } from "@/lib/types/workshop-case-summary";
import {
  formatWorkshopField,
  NOT_PROVIDED,
} from "@/lib/email/templates/workshop-shared";
import { escapeHtml } from "@/lib/utils/sanitize";

const DRIVABILITY_LABEL: Record<IntakeDrivability, string> = {
  drives_normally: "Drives normally",
  drivable_with_concern: "Drivable — customer has concerns",
  avoid_driving: "Avoid driving — safety risk",
  will_not_start: "Will not start / stranded",
  unknown: "Not confirmed",
};

const KIND_HEADER: Record<WorkshopCaseKind, string> = {
  callback: "CALLBACK REQUEST",
  booking: "BOOKING REQUEST",
  pricing: "REPAIR ESTIMATE INTAKE",
  diagnostic: "DIAGNOSTIC INTAKE",
  recovery: "RECOVERY / COLLECTION REQUEST",
};

function formatVehicleBlock(caseSummary: WorkshopCaseSummary): string {
  const parts = [
    caseSummary.vehicle,
    caseSummary.registration,
    caseSummary.vehicleEngine,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : NOT_PROVIDED;
}

function formatPreferredSlot(caseSummary: WorkshopCaseSummary): string {
  const date = caseSummary.preferredDate?.trim();
  const time = caseSummary.preferredTime?.trim();
  if (date && time) return `${date} at ${time}`;
  if (date) return date;
  if (time) return time;
  return NOT_PROVIDED;
}

function reasonLine(caseSummary: WorkshopCaseSummary): string {
  if (caseSummary.kind === "callback") {
    return formatWorkshopField(caseSummary.callbackReason);
  }
  if (caseSummary.kind === "booking") {
    return formatWorkshopField(caseSummary.bookingReason);
  }
  return formatWorkshopField(caseSummary.issueTitle ?? caseSummary.requestedAction);
}

function reasonLabel(caseSummary: WorkshopCaseSummary): string {
  if (caseSummary.kind === "callback") return "Reason";
  if (caseSummary.kind === "booking") return "Service";
  if (caseSummary.kind === "recovery") return "Recovery";
  return "Issue";
}

function caseHeader(caseSummary: WorkshopCaseSummary): string {
  const reg = caseSummary.registration.replace(/\s/g, "") || "NO-REG";
  return `${KIND_HEADER[caseSummary.kind]} — ${reg}`;
}

function slotLabel(caseSummary: WorkshopCaseSummary): string {
  if (caseSummary.kind === "callback") return "Preferred callback time";
  if (caseSummary.kind === "recovery") return "Preferred collection window";
  return "Preferred appointment";
}

export function renderWorkshopCaseBriefText(caseSummary: WorkshopCaseSummary): string[] {
  const lines: string[] = [
    "===================================",
    caseHeader(caseSummary),
    "===================================",
    "",
    "Customer:",
    `  ${formatWorkshopField(caseSummary.customerName)} · ${formatWorkshopField(caseSummary.customerPhone)}`,
  ];

  if (caseSummary.customerEmail) {
    lines.push(`  Email: ${caseSummary.customerEmail}`);
  }

  lines.push("", "Vehicle:", `  ${formatVehicleBlock(caseSummary)}`, "");
  lines.push(`${reasonLabel(caseSummary)}:`, `  ${reasonLine(caseSummary)}`, "");

  if (caseSummary.symptoms) {
    lines.push(`Symptoms:`, `  ${caseSummary.symptoms}`, "");
  }
  if (caseSummary.timeline) {
    lines.push(`Timeline:`, `  ${caseSummary.timeline}`, "");
  }
  if (caseSummary.estimatedRange) {
    lines.push(`Indicative price discussed:`, `  ${caseSummary.estimatedRange}`, "");
  }
  if (caseSummary.possibleCauses?.length) {
    lines.push(`Likely area: ${caseSummary.possibleCauses.slice(0, 3).join("; ")}`, "");
  }
  if (caseSummary.warningLights?.length) {
    lines.push(`Warning lights: ${caseSummary.warningLights.join(", ")}`, "");
  }
  if (caseSummary.collectionAddress) {
    lines.push(`Collection address:`, `  ${caseSummary.collectionAddress}`, "");
  }
  if (caseSummary.collectionDistance) {
    lines.push(`Distance: ${caseSummary.collectionDistance}`, "");
  }
  if (caseSummary.collectionPreferredWindow) {
    lines.push(`Collection window:`, `  ${caseSummary.collectionPreferredWindow}`, "");
  }

  lines.push(
    `${slotLabel(caseSummary)}:`,
    `  ${formatPreferredSlot(caseSummary)}`,
    "",
    `Urgency: ${caseSummary.urgency}`,
    `Drivability: ${DRIVABILITY_LABEL[caseSummary.drivability]}${
      caseSummary.drivabilityNote ? ` — ${caseSummary.drivabilityNote}` : ""
    }`
  );

  if (caseSummary.recommendedAction) {
    lines.push("", "Recommended action:", `  ${caseSummary.recommendedAction}`, "");
  } else {
    lines.push("", "");
  }

  return lines;
}

export function renderWorkshopCaseBriefHtml(caseSummary: WorkshopCaseSummary): string {
  const rows: Array<[string, string]> = [
    [
      "Customer",
      `${escapeHtml(formatWorkshopField(caseSummary.customerName))} · ${escapeHtml(formatWorkshopField(caseSummary.customerPhone))}`,
    ],
    ["Vehicle", escapeHtml(formatVehicleBlock(caseSummary))],
    [reasonLabel(caseSummary), escapeHtml(reasonLine(caseSummary))],
  ];

  if (caseSummary.symptoms) rows.push(["Symptoms", escapeHtml(caseSummary.symptoms)]);
  if (caseSummary.timeline) rows.push(["Timeline", escapeHtml(caseSummary.timeline)]);
  if (caseSummary.estimatedRange) {
    rows.push(["Indicative price", escapeHtml(caseSummary.estimatedRange)]);
  }
  if (caseSummary.possibleCauses?.length) {
    rows.push(["Likely area", escapeHtml(caseSummary.possibleCauses.slice(0, 3).join("; "))]);
  }
  if (caseSummary.warningLights?.length) {
    rows.push(["Warning lights", escapeHtml(caseSummary.warningLights.join(", "))]);
  }
  if (caseSummary.collectionAddress) {
    rows.push(["Collection address", escapeHtml(caseSummary.collectionAddress)]);
  }
  if (caseSummary.collectionPreferredWindow) {
    rows.push(["Collection window", escapeHtml(caseSummary.collectionPreferredWindow)]);
  }

  rows.push([slotLabel(caseSummary), escapeHtml(formatPreferredSlot(caseSummary))]);
  rows.push(["Urgency", escapeHtml(caseSummary.urgency)]);
  rows.push([
    "Drivability",
    escapeHtml(
      `${DRIVABILITY_LABEL[caseSummary.drivability]}${
        caseSummary.drivabilityNote ? ` — ${caseSummary.drivabilityNote}` : ""
      }`
    ),
  ]);

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#71717a;vertical-align:top;width:38%">${escapeHtml(label)}</td><td style="padding:4px 0;color:#fff">${value}</td></tr>`
    )
    .join("");

  const actionBlock = caseSummary.recommendedAction
    ? `<p style="margin:14px 0 0;background:#0d0d0d;border-left:3px solid #d4a63c;padding:10px 12px;border-radius:6px;color:#ddd"><strong style="color:#d4a63c">Recommended action:</strong><br/>${escapeHtml(caseSummary.recommendedAction)}</p>`
    : "";

  return `<div style="background:#141414;border:1px solid #3a3020;border-radius:10px;padding:16px 18px;margin:0 0 20px">
    <h2 style="font-size:13px;color:#d4a63c;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px">${escapeHtml(caseHeader(caseSummary))}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${tableRows}</table>
    ${actionBlock}
  </div>`;
}
