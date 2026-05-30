"use client";

import { formatPlate } from "@/lib/format-plate";
import type { WorkshopCaseKind, WorkshopCaseSummary } from "@/lib/types/workshop-case-summary";

const DRIVABILITY_LABEL = {
  drives_normally: "Drives normally",
  drivable_with_concern: "Drivable — concern noted",
  avoid_driving: "Avoid driving",
  will_not_start: "Will not start",
  unknown: "Not confirmed",
} as const;

const KIND_LABEL: Record<WorkshopCaseKind, string> = {
  callback: "Callback",
  booking: "Booking",
  pricing: "Repair estimate",
  diagnostic: "Diagnostic",
  recovery: "Recovery",
};

type Props = {
  caseSummary: WorkshopCaseSummary;
  compact?: boolean;
  className?: string;
};

function formatVehicleLine(caseSummary: WorkshopCaseSummary): string | null {
  const parts = [
    caseSummary.vehicle,
    caseSummary.registration ? formatPlate(caseSummary.registration) : null,
    caseSummary.vehicleEngine,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function formatSlot(caseSummary: WorkshopCaseSummary): string | null {
  const date = caseSummary.preferredDate?.trim();
  const time = caseSummary.preferredTime?.trim();
  if (date && time) return `${date} · ${time}`;
  return date || time || null;
}

function reasonText(caseSummary: WorkshopCaseSummary): string | null {
  if (caseSummary.kind === "callback") return caseSummary.callbackReason ?? null;
  if (caseSummary.kind === "booking") return caseSummary.bookingReason ?? null;
  if (caseSummary.issueTitle) return caseSummary.issueTitle;
  return caseSummary.requestedAction ?? null;
}

function reasonLabel(caseSummary: WorkshopCaseSummary): string {
  if (caseSummary.kind === "callback") return "Reason";
  if (caseSummary.kind === "booking") return "Service";
  if (caseSummary.kind === "recovery") return "Recovery";
  return "Issue";
}

function CaseRow({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  if (!value.trim()) return null;
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className={`leading-relaxed text-zinc-300 ${compact ? "text-xs" : "text-sm"}`}>
        {value}
      </p>
    </div>
  );
}

export function WorkshopCaseBrief({ caseSummary, compact = false, className = "" }: Props) {
  const vehicleLine = formatVehicleLine(caseSummary);
  const slot = formatSlot(caseSummary);
  const reason = reasonText(caseSummary);
  const slotLabel =
    caseSummary.kind === "callback"
      ? "Preferred callback"
      : caseSummary.kind === "recovery"
        ? "Preferred collection"
        : "Preferred appointment";

  return (
    <div
      className={`space-y-3 rounded-xl border border-[#d4a63c]/20 bg-[#d4a63c]/[0.04] p-3.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a63c]">
          {KIND_LABEL[caseSummary.kind]}
        </span>
        {caseSummary.registration ? (
          <span className="font-mono text-xs text-zinc-400">
            {formatPlate(caseSummary.registration)}
          </span>
        ) : null}
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] capitalize text-zinc-500">
          Urgency: {caseSummary.urgency}
        </span>
      </div>

      {vehicleLine ? <CaseRow label="Vehicle" value={vehicleLine} compact={compact} /> : null}
      {reason ? <CaseRow label={reasonLabel(caseSummary)} value={reason} compact={compact} /> : null}
      {caseSummary.primarySymptom ? (
        <CaseRow label="Primary symptom" value={caseSummary.primarySymptom} compact={compact} />
      ) : null}
      {caseSummary.symptoms ? (
        <CaseRow label="Symptoms" value={caseSummary.symptoms} compact={compact} />
      ) : null}
      {caseSummary.drivingSymptoms ? (
        <CaseRow label="Driving symptoms" value={caseSummary.drivingSymptoms} compact={compact} />
      ) : null}
      {caseSummary.timeline ? (
        <CaseRow label="Timeline" value={caseSummary.timeline} compact={compact} />
      ) : null}
      {caseSummary.warningLights?.length ? (
        <CaseRow
          label="Warning lights"
          value={caseSummary.warningLights.join(", ")}
          compact={compact}
        />
      ) : null}
      {caseSummary.estimatedRange ? (
        <CaseRow label="Estimate discussed" value={caseSummary.estimatedRange} compact={compact} />
      ) : null}
      {caseSummary.possibleCauses?.length ? (
        <CaseRow
          label="Likely causes"
          value={caseSummary.possibleCauses.slice(0, 3).join("; ")}
          compact={compact}
        />
      ) : null}
      {caseSummary.confidenceLevel ? (
        <CaseRow
          label="Confidence"
          value={caseSummary.confidenceLevel}
          compact={compact}
        />
      ) : null}
      {caseSummary.collectionAddress ? (
        <CaseRow label="Collection address" value={caseSummary.collectionAddress} compact={compact} />
      ) : null}
      {caseSummary.collectionPreferredWindow ? (
        <CaseRow
          label="Collection window"
          value={caseSummary.collectionPreferredWindow}
          compact={compact}
        />
      ) : null}
      {slot ? <CaseRow label={slotLabel} value={slot} compact={compact} /> : null}
      <CaseRow
        label="Drivability"
        value={`${DRIVABILITY_LABEL[caseSummary.drivability]}${
          caseSummary.drivabilityNote ? ` — ${caseSummary.drivabilityNote}` : ""
        }`}
        compact={compact}
      />
      {caseSummary.recommendedAction ? (
        <CaseRow label="Recommended action" value={caseSummary.recommendedAction} compact={compact} />
      ) : null}
    </div>
  );
}
