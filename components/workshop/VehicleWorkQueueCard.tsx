"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Loader2, Phone, Wrench } from "lucide-react";
import { AdminStatusBadge } from "@/components/enterprise/AdminStatusBadge";
import { BookingVehiclePrecheck } from "@/components/vehicle/BookingVehiclePrecheck";
import { WorkshopCustomerPhone } from "@/features/booking/components/WorkshopCustomerPhone";
import { phoneTelHref } from "@/lib/format-contact";
import type { BookingStatus } from "@/lib/types/booking";
import type { JobStatus } from "@/lib/types/job";
import type { WorkQueueItem } from "@/lib/workshop/work-queue";

type Props = {
  item: WorkQueueItem;
  confirming?: boolean;
  onConfirm?: () => void;
};

export function VehicleWorkQueueCard({ item, confirming = false, onConfirm }: Props) {
  const [vehicleDataOpen, setVehicleDataOpen] = useState(false);
  const phoneHref = phoneTelHref(item.customerPhone);
  const isBooking = item.kind === "booking";
  const canConfirm =
    isBooking && item.status !== "confirmed" && item.status !== "rejected";

  const openJobHref = item.jobId
    ? `/admin/jobs/${item.jobId}`
    : item.bookingId
      ? `/admin/bookings/${item.bookingId}`
      : `/admin/jobs`;

  return (
    <article className="premium-card flex flex-col rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <AdminStatusBadge
          kind={isBooking ? "booking" : "job"}
          status={
            isBooking ? (item.status as BookingStatus) : (item.status as JobStatus)
          }
        />
        {item.priority === "waiting_customer" || item.priority === "waiting_parts" ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Needs attention
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="font-mono text-lg font-semibold tracking-wide text-[#d4a63c]">
          {item.registration}
        </p>
        {item.vehicleLabel ? (
          <p className="text-xs text-zinc-500">{item.vehicleLabel}</p>
        ) : null}
        <p className="text-base font-medium text-white">{item.service}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          {item.scheduledDate}
        </span>
        {item.scheduledTime ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            {item.scheduledTime}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/35 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Customer
        </p>
        <p className="mt-1 text-sm font-medium text-white">{item.customerName}</p>
        <WorkshopCustomerPhone phone={item.customerPhone} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={phoneHref}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/55 hover:bg-emerald-500/15 sm:flex-none sm:px-4"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden />
          Call
        </a>
        <Link
          href={openJobHref}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-3 py-2 text-xs font-semibold text-[#e8d5a3] transition hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/15 sm:flex-none sm:px-4"
        >
          <Wrench className="h-3.5 w-3.5" aria-hidden />
          Open Job
        </Link>
        <button
          type="button"
          onClick={() => setVehicleDataOpen((open) => !open)}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition hover:border-cyan/45 hover:bg-cyan/15 sm:flex-none sm:px-4"
        >
          Vehicle Data
        </button>
        {isBooking && onConfirm ? (
          <button
            type="button"
            disabled={confirming || !canConfirm}
            onClick={onConfirm}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:px-4"
          >
            {confirming ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Confirm"
            )}
          </button>
        ) : null}
      </div>

      {vehicleDataOpen ? (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <BookingVehiclePrecheck registration={item.registration} autoLoad />
        </div>
      ) : null}
    </article>
  );
}
