"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import { localIsoDate } from "@/lib/date";
import {
  bookingServiceOptions,
  bookingTimeSlotsDetailed,
} from "@/lib/config/services";
import type { SlotAvailability } from "@/lib/types/slot-availability";
import { BookingDatePicker } from "@/features/booking/components/BookingDatePicker";

function isSundayIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getDay() === 0;
}

/** Skip Sundays when resolving presets. */
function nextOpenPreset(offsetDays: number, offsetMonths = 0): string {
  let iso = localIsoDate(offsetDays, offsetMonths);
  let guard = 0;
  while (isSundayIso(iso) && guard < 7) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y!, m! - 1, d!);
    dt.setDate(dt.getDate() + 1);
    iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    guard++;
  }
  return iso;
}

const DATE_PRESETS = [
  { label: "Today", value: () => nextOpenPreset(0) },
  { label: "Tomorrow", value: () => nextOpenPreset(1) },
  { label: "Next week", value: () => nextOpenPreset(7) },
  { label: "Next month", value: () => nextOpenPreset(0, 1) },
] as const;

type Props = {
  service: string;
  date: string;
  time: string;
  onServiceChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
};

/**
 * Fetches live slot availability from GET /api/booking-slots?date=YYYY-MM-DD.
 * Returns null while loading (show full grid optimistically) or on fetch error
 * (degrade gracefully — all slots remain selectable).
 */
function useSlotAvailability(date: string): SlotAvailability | null {
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!date) {
      setAvailability(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAvailability(null);

    fetch(`/api/booking-slots?date=${date}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json: { ok: boolean; data: SlotAvailability }) => {
        if (json.ok) setAvailability(json.data);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("[BookingSlotStep] availability fetch failed:", err);
        }
      });

    return () => controller.abort();
  }, [date]);

  return availability;
}

export function BookingSlotStep({
  service,
  date,
  time,
  onServiceChange,
  onDateChange,
  onTimeChange,
}: Props) {
  const [minDate, setMinDate] = useState("");
  const availability = useSlotAvailability(date);

  useEffect(() => {
    setMinDate(localIsoDate(0));
  }, []);

  // Clear selected time only when it becomes invalid — never call onChange if already empty
  // (inline onTimeChange from parent is unstable and would otherwise loop forever).
  useEffect(() => {
    if (!time || !availability) return;
    const invalid =
      availability.closed || !availability.available.includes(time);
    if (invalid) onTimeChange("");
  }, [availability, time, onTimeChange]);

  const isSlotAvailable = (slot: string): boolean => {
    if (!availability) return true;
    if (availability.closed) return false;
    return availability.available.includes(slot);
  };

  const closedMessage =
    availability?.closedReason?.message ||
    (availability?.closed
      ? "The workshop is not taking bookings on this date. Please choose a different day."
      : null);

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
        <div className="mb-3 flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => {
            const value = preset.value();
            const active = date === value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onDateChange(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-white/10 text-zinc-400 hover:border-white/20"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <BookingDatePicker
          value={date}
          minDate={minDate}
          onChange={onDateChange}
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5 text-cyan" aria-hidden />
          {BOOKING_INTAKE_COPY.timeLabel}
        </label>

        {availability?.closed && closedMessage && (
          <p
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
            title={availability.closedReason?.label}
          >
            {closedMessage}
          </p>
        )}

        {!availability?.closed && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(bookingTimeSlotsDetailed as readonly string[]).map((slot) => {
              const available = isSlotAvailable(slot);
              const selected = time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!available}
                  onClick={() => available && onTimeChange(slot)}
                  aria-pressed={selected}
                  aria-disabled={!available}
                  className={`rounded-xl border py-2.5 text-sm transition ${
                    !available
                      ? "cursor-not-allowed border-white/5 text-zinc-600 line-through"
                      : selected
                        ? "border-cyan bg-cyan/10 font-medium text-cyan"
                        : "border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
