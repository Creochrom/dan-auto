import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types/job";
import type { BookingStatus } from "@/lib/types/booking";
import type { LeadStatus } from "@/lib/types/lead";

type StatusKind = "booking" | "lead" | "job";

type StatusValue = BookingStatus | LeadStatus | JobStatus;

const STATUS_STYLES: Record<StatusKind, Record<string, string>> = {
  booking: {
    new: "bg-cyan/15 text-cyan",
    awaiting_callback: "bg-amber-500/15 text-amber-300",
    confirmed: "bg-emerald-500/15 text-emerald-300",
    rescheduled: "bg-violet-500/15 text-violet-300",
    rejected: "bg-rose-500/15 text-rose-300",
    in_progress: "bg-blue-500/15 text-blue-300",
    completed: "bg-zinc-500/15 text-zinc-400",
  },
  lead: {
    new: "bg-cyan/15 text-cyan",
    contacted: "bg-amber-500/15 text-amber-300",
    qualified: "bg-blue-500/15 text-blue-300",
    converted: "bg-emerald-500/15 text-emerald-300",
    closed: "bg-zinc-500/15 text-zinc-400",
  },
  job: {
    booked: "bg-zinc-500/15 text-zinc-300",
    checked_in: "bg-cyan/15 text-cyan",
    diagnosing: "bg-blue-500/15 text-blue-300",
    awaiting_approval: "bg-amber-500/15 text-amber-300",
    awaiting_parts: "bg-orange-500/15 text-orange-300",
    in_progress: "bg-indigo-500/15 text-indigo-300",
    quality_check: "bg-violet-500/15 text-violet-300",
    ready_for_collection: "bg-emerald-500/15 text-emerald-300",
    collected: "bg-emerald-700/20 text-emerald-200",
    cancelled: "bg-rose-500/15 text-rose-300",
  },
};

function formatLabel(kind: StatusKind, status: StatusValue): string {
  if (kind === "job" && JOB_STATUS_LABELS[status as JobStatus]) {
    return JOB_STATUS_LABELS[status as JobStatus];
  }
  return String(status).replaceAll("_", " ");
}

export function AdminStatusBadge({
  kind,
  status,
}: {
  kind: StatusKind;
  status: StatusValue;
}) {
  const style = STATUS_STYLES[kind][String(status)] ?? "bg-zinc-500/15 text-zinc-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}
    >
      {formatLabel(kind, status)}
    </span>
  );
}
