import type { BookingStatus } from "@/lib/types/booking";
import { WorkshopStatusBadge } from "@/components/workshop/WorkshopStatusBadge";

const STYLES: Record<BookingStatus, string> = {
  new: "bg-cyan/20 text-cyan ring-1 ring-cyan/30",
  awaiting_callback: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20",
  confirmed: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20",
  rescheduled: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/20",
  rejected: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/20",
  in_progress: "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/20",
  completed: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/15",
};

const LABELS: Record<BookingStatus, string> = {
  new: "New",
  awaiting_callback: "Awaiting callback",
  confirmed: "Confirmed",
  rescheduled: "Rescheduled",
  rejected: "Rejected",
  in_progress: "In progress",
  completed: "Completed",
};

type Props = {
  status: BookingStatus;
  size?: "sm" | "md";
  pulse?: boolean;
};

export function BookingStatusBadge({ status, size = "md", pulse = false }: Props) {
  return <WorkshopStatusBadge kind="booking" status={status} size={size} pulse={pulse} />;
}

export { LABELS as BOOKING_STATUS_LABELS, STYLES as BOOKING_STATUS_STYLES };
