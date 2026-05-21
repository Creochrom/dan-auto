"use client";

import { Calendar, Clock } from "lucide-react";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import {
  bookingServiceOptions,
  bookingTimeSlotsDetailed,
} from "@/lib/config/services";

type Props = {
  service: string;
  date: string;
  time: string;
  onServiceChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onContinue: () => void;
  canContinue: boolean;
};

export function BookingSlotStep({
  service,
  date,
  time,
  onServiceChange,
  onDateChange,
  onTimeChange,
  onContinue,
  canContinue,
}: Props) {
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <Calendar className="h-3.5 w-3.5 text-cyan" aria-hidden />
          {BOOKING_INTAKE_COPY.serviceLabel}
        </label>
        <select
          value={service}
          onChange={(e) => onServiceChange(e.target.value)}
          className="input-premium w-full rounded-xl px-4 py-3 text-sm text-white"
        >
          {bookingServiceOptions.map((o) => (
            <option key={o} value={o} className="bg-zinc-900">
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs text-zinc-500">
          {BOOKING_INTAKE_COPY.dateLabel}
        </label>
        <input
          type="date"
          required
          min={minDate}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white focus:border-cyan/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5 text-cyan" aria-hidden />
          {BOOKING_INTAKE_COPY.timeLabel}
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {bookingTimeSlotsDetailed.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTimeChange(t)}
              className={`rounded-xl border py-2.5 text-sm transition ${
                time === t
                  ? "border-cyan bg-cyan/10 font-medium text-cyan"
                  : "border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="btn-glow w-full rounded-full py-3.5 text-sm font-semibold text-black disabled:opacity-40"
      >
        {BOOKING_INTAKE_COPY.continueToIntake}
      </button>
    </div>
  );
}
