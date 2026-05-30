"use client";

import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import { WorkshopCustomerPhone } from "@/features/booking/components/WorkshopCustomerPhone";
import type { Booking } from "@/lib/types/booking";
import { resolveWorkshopCaseFromBooking } from "@/lib/types/workshop-case-summary";
import { WorkshopCaseBrief } from "@/components/workshop/WorkshopCaseBrief";

type Props = {
  booking: Booking;
};

export function BookingCard({ booking }: Props) {
  const caseSummary = resolveWorkshopCaseFromBooking(booking);
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
      <p className="mt-2 text-sm text-zinc-300">{booking.customerName}</p>
      <WorkshopCustomerPhone phone={booking.customerPhone} variant="inline" className="mt-1" />
      <div className="mt-4">
        <WorkshopCaseBrief caseSummary={caseSummary} compact />
      </div>
    </article>
  );
}
