"use client";

import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types/job";
import type { BookingStatus } from "@/lib/types/booking";
import type { LeadStatus } from "@/lib/types/lead";

type StatusKind = "booking" | "lead" | "job";
type StatusValue = BookingStatus | LeadStatus | JobStatus;

const STATUS_STYLES: Record<StatusKind, Record<string, string>> = {
  booking: {
    new: "bg-cyan/20 text-cyan ring-1 ring-cyan/30",
    awaiting_callback: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20",
    confirmed: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20",
    rescheduled: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/20",
    rejected: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20",
    in_progress: "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/20",
    completed: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/15",
  },
  lead: {
    new: "bg-cyan/15 text-cyan ring-1 ring-cyan/20",
    contacted: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
    qualified: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20",
    converted: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20",
    closed: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/20",
  },
  job: {
    booked: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/20",
    checked_in: "bg-cyan/15 text-cyan ring-1 ring-cyan/20",
    diagnosing: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20",
    awaiting_approval: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20",
    awaiting_parts: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/20",
    in_progress: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20",
    quality_check: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20",
    ready_for_collection: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20",
    collected: "bg-emerald-700/20 text-emerald-200 ring-1 ring-emerald-700/30",
    cancelled: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20",
  },
};

function formatLabel(kind: StatusKind, status: StatusValue): string {
  if (kind === "job" && JOB_STATUS_LABELS[status as JobStatus]) {
    return JOB_STATUS_LABELS[status as JobStatus];
  }
  return String(status).replaceAll("_", " ");
}

export function WorkshopStatusBadge({
  kind,
  status,
  size = "md",
  pulse = false,
}: {
  kind: StatusKind;
  status: StatusValue;
  size?: "sm" | "md";
  pulse?: boolean;
}) {
  const style = STATUS_STYLES[kind][String(status)] ?? "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/20";
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] font-medium"
      : "px-2.5 py-1 text-[11px] font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide uppercase ${sizeClass} ${style} ${pulse ? "animate-pulse" : ""}`}
    >
      {formatLabel(kind, status)}
    </span>
  );
}
