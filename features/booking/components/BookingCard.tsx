"use client";

import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import type { Booking } from "@/lib/types/booking";

type Props = {
  booking: Booking;
};

export function BookingCard({ booking }: Props) {
  const intake = booking.intakeSummary;
  const dateTime =
    booking.status === "rescheduled"
      ? `Rescheduled to ${booking.preferredDate} · ${booking.preferredTime}`
      : `${booking.preferredDate} · ${booking.preferredTime}`;

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-black/45 p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm text-[#d4a63c]">{booking.registration}</p>
          <p className="mt-1 text-sm font-medium text-white">{booking.service}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="mt-3 text-xs text-zinc-500">{dateTime}</p>
      <p className="mt-2 text-sm text-zinc-300">
        {booking.customerName} · {booking.customerPhone}
      </p>
      {intake && (
        <div className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
          <p className="line-clamp-2">{intake.symptoms}</p>
          {intake.possibleCauses.length > 0 && (
            <p className="mt-1 text-zinc-500">
              {intake.possibleCauses.slice(0, 2).join(", ")}
            </p>
          )}
          <p className="mt-1">
            {intake.estimatedRange ?? "—"} · Urgency: {intake.urgency}
            {intake.uploadedFiles.length
              ? ` · ${intake.uploadedFiles.length} file(s)`
              : ""}
          </p>
        </div>
      )}
    </article>
  );
}
