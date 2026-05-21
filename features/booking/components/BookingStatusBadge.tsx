import type { BookingStatus } from "@/lib/types/booking";

const STYLES: Record<BookingStatus, string> = {
  new: "bg-cyan/15 text-cyan",
  awaiting_callback: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  in_progress: "bg-blue-500/15 text-blue-300",
  completed: "bg-zinc-500/15 text-zinc-400",
};

const LABELS: Record<BookingStatus, string> = {
  new: "New",
  awaiting_callback: "Awaiting callback",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
