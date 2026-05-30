"use client";

import { Loader2 } from "lucide-react";
import {
  BOOKING_REVIEW_HELPER,
  BOOKING_REVIEW_INTRO,
  BOOKING_CHANGE_DETAILS_PROMPT,
} from "@/lib/config/booking-flow-copy";
import type { BookingPreviewSummary } from "@/lib/services/booking-preview";
import { formatPlate } from "@/lib/format-plate";

export type BookingReviewPanelMode = "review" | "change_details";

type Props = {
  summary: BookingPreviewSummary;
  mode: BookingReviewPanelMode;
  submitting?: boolean;
  onSend: () => void;
  onChangeDetails: () => void;
  onNotNow: () => void;
  onChangeDay: () => void;
  onChangeContact: () => void;
  onChangeService: () => void;
  onChangeAppointment: () => void;
  onBackToReview: () => void;
  className?: string;
};

export function BookingHandoffReview({
  summary,
  mode,
  submitting = false,
  onSend,
  onChangeDetails,
  onNotNow,
  onChangeDay,
  onChangeContact,
  onChangeService,
  onChangeAppointment,
  onBackToReview,
  className = "",
}: Props) {
  const plate = summary.registration ? formatPlate(summary.registration) : null;

  return (
    <div
      className={`rounded-xl border border-[#d4a63c]/25 bg-[#0a0a0a]/90 px-3.5 py-3.5 text-sm text-zinc-200 shadow-lg shadow-black/20 ${className}`}
      role="region"
      aria-label="Review service request"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a63c]/90">
        Review service request
      </p>

      {mode === "review" ? (
        <>
          <dl className="mt-2.5 space-y-2 text-xs leading-relaxed">
            <div>
              <dt className="text-zinc-500">Vehicle</dt>
              <dd className="mt-0.5 font-medium text-white">
                {summary.vehicleLine}
                {plate ? (
                  <span className="ml-1.5 font-mono text-[11px] text-[#d4a63c]/90">{plate}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Requested service</dt>
              <dd className="mt-0.5 text-zinc-100">{summary.service}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Preferred appointment</dt>
              <dd className="mt-0.5 text-zinc-100">{summary.preferred}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Contact</dt>
              <dd className="mt-0.5 font-mono text-zinc-100">{summary.contactMasked}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-zinc-400">{BOOKING_REVIEW_INTRO}</p>
          <p className="mt-1.5 text-xs font-medium text-[#d4a63c]/85">{BOOKING_REVIEW_HELPER}</p>

          <div className="mt-3.5 flex flex-col gap-2">
            <button
              type="button"
              onClick={onSend}
              disabled={submitting}
              className="flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#d4a63c] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#e8c96a] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Sending…
                </>
              ) : (
                "Send booking request"
              )}
            </button>
            <button
              type="button"
              onClick={onChangeService}
              disabled={submitting}
              className="min-h-[36px] rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/[0.06] disabled:opacity-60"
            >
              Change service
            </button>
            <button
              type="button"
              onClick={onChangeAppointment}
              disabled={submitting}
              className="min-h-[36px] rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/[0.06] disabled:opacity-60"
            >
              Change appointment
            </button>
            <button
              type="button"
              onClick={onChangeContact}
              disabled={submitting}
              className="min-h-[36px] rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/[0.06] disabled:opacity-60"
            >
              Change contact number
            </button>
            <button
              type="button"
              onClick={onNotNow}
              disabled={submitting}
              className="min-h-[32px] px-3 py-1.5 text-xs text-zinc-500 transition hover:text-zinc-300 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">{BOOKING_CHANGE_DETAILS_PROMPT}</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={onChangeService}
              disabled={submitting}
              className="min-h-[36px] rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/[0.06] disabled:opacity-60"
            >
              Change service
            </button>
            <button
              type="button"
              onClick={onChangeDay}
              disabled={submitting}
              className="min-h-[36px] rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/[0.06] disabled:opacity-60"
            >
              Change appointment
            </button>
            <button
              type="button"
              onClick={onChangeContact}
              disabled={submitting}
              className="min-h-[36px] rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/[0.06] disabled:opacity-60"
            >
              Change contact number
            </button>
            <button
              type="button"
              onClick={onBackToReview}
              disabled={submitting}
              className="mt-1 min-h-[32px] px-3 py-1.5 text-xs text-zinc-500 transition hover:text-zinc-300 disabled:opacity-60"
            >
              Back to review
            </button>
          </div>
        </>
      )}
    </div>
  );
}
