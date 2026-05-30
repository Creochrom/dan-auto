"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Loader2, Phone } from "lucide-react";
import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import { WorkshopCustomerPhone } from "@/features/booking/components/WorkshopCustomerPhone";
import { BookingVehiclePrecheck } from "@/components/vehicle/BookingVehiclePrecheck";
import { phoneTelHref } from "@/lib/format-contact";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types/booking";

type Props = {
  booking: Booking;
  statusChanging?: boolean;
  onStatusChange: (status: BookingStatus) => void;
  onConfirm: () => void;
};

export function WorkshopBookingCard({
  booking,
  statusChanging = false,
  onStatusChange,
  onConfirm,
}: Props) {
  const [vehicleDataOpen, setVehicleDataOpen] = useState(false);
  const intake = booking.intakeSummary;
  const phoneHref = phoneTelHref(booking.customerPhone);
  const canConfirm = booking.status !== "confirmed" && booking.status !== "rejected";

  return (
    <article className="premium-card flex flex-col rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="space-y-1">
        <p className="font-mono text-lg font-semibold tracking-wide text-[#d4a63c]">
          {booking.registration}
        </p>
        <p className="text-base font-medium text-white">{booking.service}</p>
        {intake?.symptoms ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{intake.symptoms}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          {booking.status === "rescheduled"
            ? `Rescheduled · ${booking.preferredDate}`
            : booking.preferredDate}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          {booking.preferredTime}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/35 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Customer
        </p>
        <p className="mt-1 text-sm font-medium text-white">{booking.customerName}</p>
        <WorkshopCustomerPhone phone={booking.customerPhone} />
      </div>

      <label className="mt-4 block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Status
        </span>
        <select
          className="input-premium mt-1.5 h-11 w-full rounded-xl px-3 text-sm text-white"
          value={booking.status}
          disabled={statusChanging}
          onChange={(e) => onStatusChange(e.target.value as BookingStatus)}
        >
          {BOOKING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={phoneHref}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/55 hover:bg-emerald-500/15 sm:flex-none sm:px-4"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden />
          Call
        </a>
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-3 py-2 text-xs font-semibold text-[#e8d5a3] transition hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/15 sm:flex-none sm:px-4"
        >
          Details
        </Link>
        <button
          type="button"
          onClick={() => setVehicleDataOpen((open) => !open)}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition hover:border-cyan/45 hover:bg-cyan/15 sm:flex-none sm:px-4"
        >
          Vehicle Data
        </button>
        <button
          type="button"
          disabled={statusChanging || !canConfirm}
          onClick={onConfirm}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:px-4"
        >
          {statusChanging ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Confirm"
          )}
        </button>
      </div>

      {vehicleDataOpen ? (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <BookingVehiclePrecheck registration={booking.registration} autoLoad />
        </div>
      ) : null}
    </article>
  );
}
