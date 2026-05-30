"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Clock,
  Loader2,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import { BookingStatusBadge } from "@/features/booking/components/BookingStatusBadge";
import { WorkshopCustomerPhone } from "@/features/booking/components/WorkshopCustomerPhone";
import { BookingVehiclePrecheck } from "@/components/vehicle/BookingVehiclePrecheck";
import { WorkshopCaseBrief } from "@/components/workshop/WorkshopCaseBrief";
import { WorkshopDisclosureSection } from "@/components/workshop/WorkshopDisclosureSection";
import { workshopActionButtonClass } from "@/components/workshop/WorkshopActionButton";
import { formatPlate } from "@/lib/format-plate";
import { phoneTelHref } from "@/lib/format-contact";
import { resolveWorkshopCaseFromBooking } from "@/lib/types/workshop-case-summary";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types/booking";

type Props = {
  booking: Booking;
  statusChanging?: boolean;
  deleting?: boolean;
  onStatusChange: (status: BookingStatus) => void;
  onConfirm: () => void;
  onDelete?: () => void;
};

function useDismissOnOutside(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, ref]);
}

export function WorkshopBookingCard({
  booking,
  statusChanging = false,
  deleting = false,
  onStatusChange,
  onConfirm,
  onDelete,
}: Props) {
  const [vehicleDataOpen, setVehicleDataOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  useDismissOnOutside(statusMenuOpen, () => setStatusMenuOpen(false), statusMenuRef);
  useDismissOnOutside(overflowOpen, () => setOverflowOpen(false), overflowRef);

  const caseSummary = resolveWorkshopCaseFromBooking(booking);
  const intakeSummary = booking.intakeSummary;
  const conversationRef = intakeSummary?.chatSessionId ?? caseSummary.chatSessionId;
  const aiSummary = [
    intakeSummary?.severityNote?.trim(),
    caseSummary.recommendedAction?.trim(),
    caseSummary.possibleCauses?.slice(0, 3).join("; "),
  ]
    .filter(Boolean)
    .join(" ");
  const phoneHref = phoneTelHref(booking.customerPhone);
  const busy = statusChanging || deleting;
  const canConfirm = booking.status !== "confirmed" && booking.status !== "rejected";
  const isNew = booking.status === "new";
  const plate = formatPlate(booking.registration);

  function handleDelete() {
    setOverflowOpen(false);
    onDelete?.();
  }

  return (
    <article
      className={`premium-card relative flex flex-col rounded-2xl p-4 sm:p-5 ${
        isNew
          ? "border-cyan/25 bg-gradient-to-b from-cyan/[0.06] to-transparent shadow-[inset_0_1px_0_rgba(34,211,238,0.12)]"
          : ""
      }`}
    >
      {/* Header: status + overflow */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div ref={statusMenuRef} className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} pulse={isNew} />
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatusMenuOpen((open) => !open)}
              className="inline-flex min-h-8 items-center gap-0.5 rounded-md px-1.5 text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-40"
              aria-expanded={statusMenuOpen}
              aria-haspopup="listbox"
            >
              Change
              <ChevronDown
                className={`h-3 w-3 transition ${statusMenuOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          </div>

          {statusMenuOpen ? (
            <div
              role="listbox"
              aria-label="Booking status"
              className="absolute left-0 top-full z-20 mt-1.5 min-w-[11rem] rounded-xl border border-white/10 bg-[#0c0b0a]/98 p-1 shadow-xl backdrop-blur-md"
            >
              {BOOKING_STATUSES.map((status) => {
                const selected = status === booking.status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={busy || selected}
                    onClick={() => {
                      setStatusMenuOpen(false);
                      onStatusChange(status);
                    }}
                    className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-default disabled:opacity-50"
                  >
                    <BookingStatusBadge status={status} size="sm" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div ref={overflowRef} className="relative shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => setOverflowOpen((open) => !open)}
            aria-label="Booking actions"
            aria-expanded={overflowOpen}
            aria-haspopup="menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-40"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            )}
          </button>

          {overflowOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-white/10 bg-[#0c0b0a]/98 py-1 shadow-xl backdrop-blur-md"
            >
              <Link
                href={`/admin/bookings/${booking.id}`}
                role="menuitem"
                onClick={() => setOverflowOpen(false)}
                className="block px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
              >
                Open details
              </Link>
              <Link
                href={`/admin/bookings/${booking.id}#reschedule`}
                role="menuitem"
                onClick={() => setOverflowOpen(false)}
                className="block px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]"
              >
                Reschedule
              </Link>
              <div className="my-1 border-t border-white/[0.06]" />
              {onDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={handleDelete}
                  className="block w-full px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-40"
                >
                  Delete booking
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Vehicle + service */}
      <div className="space-y-1.5">
        <p className="font-mono text-2xl font-bold tracking-[0.06em] text-white sm:text-[1.65rem]">
          {plate}
        </p>
        {booking.vehicleModel ? (
          <p className="text-xs text-zinc-500">{booking.vehicleModel}</p>
        ) : null}
        <p className="text-[15px] font-medium leading-snug text-zinc-100">{booking.service}</p>
      </div>

      {/* Schedule */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          {booking.status === "rescheduled"
            ? `Rescheduled · ${booking.preferredDate}`
            : booking.preferredDate}
        </span>
        <span className="text-zinc-600" aria-hidden>
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          {booking.preferredTime}
        </span>
      </div>

      {/* Customer — flat, no nested card */}
      <div className="mt-4 border-t border-white/[0.06] pt-3.5">
        <p className="text-sm font-medium text-zinc-200">{booking.customerName}</p>
        <WorkshopCustomerPhone
          phone={booking.customerPhone}
          variant="inline"
          className="mt-1 text-sm text-zinc-400 hover:text-emerald-300"
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={busy || !canConfirm}
          onClick={onConfirm}
          className={`${workshopActionButtonClass("gold")} min-h-11 w-full gap-2 rounded-xl px-4 text-sm shadow-[0_8px_24px_-8px_rgba(212,166,60,0.55)] disabled:cursor-not-allowed disabled:opacity-45`}
        >
          {statusChanging ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Confirming…
            </>
          ) : (
            "Confirm booking"
          )}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <a
            href={phoneHref}
            className={`${workshopActionButtonClass("neutral")} gap-1 rounded-lg px-2 text-[11px] font-medium sm:text-xs`}
          >
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Call
          </a>
          <button
            type="button"
            onClick={() => setVehicleDataOpen((open) => !open)}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-2 text-[11px] font-medium transition sm:text-xs ${
              vehicleDataOpen
                ? workshopActionButtonClass("vehicle")
                : workshopActionButtonClass("neutral")
            }`}
          >
            Vehicle data
          </button>
          <Link
            href={`/admin/bookings/${booking.id}`}
            className={`${workshopActionButtonClass("neutral")} rounded-lg px-2 text-[11px] font-medium sm:text-xs`}
          >
            Details
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-3.5">
        <WorkshopDisclosureSection
          title="Customer notes"
          subtitle="Case context from web or assistant handoff"
          defaultOpen={false}
        >
          <WorkshopCaseBrief caseSummary={caseSummary} compact />
          {!booking.notes?.trim() ? null : (
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">{booking.notes.trim()}</p>
          )}
        </WorkshopDisclosureSection>

        <WorkshopDisclosureSection
          title="Vehicle information"
          subtitle="Live DVLA + MOT precheck"
          open={vehicleDataOpen}
          onToggle={setVehicleDataOpen}
        >
          <BookingVehiclePrecheck registration={booking.registration} autoLoad />
        </WorkshopDisclosureSection>

        <WorkshopDisclosureSection
          title="Intake summary"
          subtitle="Structured booking details"
          defaultOpen={false}
        >
          <dl className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Urgency</dt>
              <dd className="mt-0.5 capitalize text-zinc-200">{intakeSummary?.urgency ?? "medium"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Estimate</dt>
              <dd className="mt-0.5 text-zinc-200">{intakeSummary?.estimatedRange ?? "Not set"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Symptoms</dt>
              <dd className="mt-0.5 text-zinc-300">
                {intakeSummary?.symptoms?.trim() || "No symptom summary provided."}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Possible causes</dt>
              <dd className="mt-0.5 text-zinc-300">
                {intakeSummary?.possibleCauses?.length
                  ? intakeSummary.possibleCauses.join("; ")
                  : "No likely causes captured."}
              </dd>
            </div>
          </dl>
        </WorkshopDisclosureSection>

        <WorkshopDisclosureSection
          title="Assistant conversation"
          subtitle="Booking metadata and handoff trace"
          defaultOpen={false}
        >
          <dl className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Source</dt>
              <dd className="mt-0.5 capitalize text-zinc-200">{booking.source}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Duration</dt>
              <dd className="mt-0.5 text-zinc-200">{booking.duration}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Created</dt>
              <dd className="mt-0.5 text-zinc-300">
                {new Date(booking.createdAt).toLocaleString("en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Updated</dt>
              <dd className="mt-0.5 text-zinc-300">
                {new Date(booking.updatedAt).toLocaleString("en-GB")}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">AI summary</dt>
              <dd className="mt-0.5 text-zinc-300">{aiSummary || "No AI summary available."}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Conversation ref</dt>
              <dd className="mt-0.5 break-all text-zinc-300">{conversationRef ?? "Not linked"}</dd>
            </div>
          </dl>
        </WorkshopDisclosureSection>
      </div>
    </article>
  );
}
