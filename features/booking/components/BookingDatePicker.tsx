"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localIsoDate } from "@/lib/date";
import type { SlotAvailability } from "@/lib/types/slot-availability";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Props = {
  value: string;
  minDate?: string;
  onChange: (isoDate: string) => void;
};

function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function toIso(year: number, monthIndex: number, day: number): string {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Month calendar that disables Sundays and workshop closure dates.
 * Loads closed days via GET /api/booking-slots?from=&to=.
 */
export function BookingDatePicker({ value, minDate, onChange }: Props) {
  const today = minDate || localIsoDate(0);
  const initial = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : today;
  const [viewYear, setViewYear] = useState(() => Number(initial.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(initial.slice(5, 7)) - 1);
  const [closedByDate, setClosedByDate] = useState<Map<string, string>>(new Map());

  const rangeFrom = useMemo(
    () => toIso(viewYear, viewMonth, 1),
    [viewYear, viewMonth]
  );
  const rangeTo = useMemo(() => {
    const last = new Date(viewYear, viewMonth + 1, 0).getDate();
    return toIso(viewYear, viewMonth, last);
  }, [viewYear, viewMonth]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/booking-slots?from=${rangeFrom}&to=${rangeTo}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json: { ok?: boolean; data?: { availability?: SlotAvailability[] } }) => {
        if (!json.ok || !json.data?.availability) return;
        const map = new Map<string, string>();
        for (const day of json.data.availability) {
          if (day.closed) {
            map.set(
              day.date,
              day.closedReason?.label ||
                (day.closedReason?.kind === "sunday" ? "Sunday" : "Workshop closed")
            );
          }
        }
        setClosedByDate(map);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("[BookingDatePicker] range fetch failed:", err);
        }
      });
    return () => controller.abort();
  }, [rangeFrom, rangeTo]);

  const cells = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0 Sun
    // Convert to Monday-first offset (Mon=0 … Sun=6)
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const items: Array<{
      day: number | null;
      iso?: string;
      disabled?: boolean;
      title?: string;
    }> = [];

    for (let i = 0; i < offset; i++) items.push({ day: null });

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toIso(viewYear, viewMonth, d);
      const past = iso < today;
      const closedLabel = closedByDate.get(iso);
      const isSun = new Date(viewYear, viewMonth, d).getDay() === 0;
      const disabled = past || Boolean(closedLabel) || isSun;
      const title = past
        ? "Past date"
        : closedLabel || (isSun ? "Sunday" : undefined);
      items.push({ day: d, iso, disabled, title });
    }

    return items;
  }, [viewYear, viewMonth, today, closedByDate]);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:border-white/20 hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium text-zinc-200">
          {monthLabel(viewYear, viewMonth)}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:border-white/20 hover:text-white"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className={`py-1 text-center text-[10px] uppercase tracking-wide ${
              d === "Sun" ? "text-zinc-600" : "text-zinc-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={`e-${i}`} className="h-9" />;
          }
          const selected = value === cell.iso;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={cell.disabled}
              title={cell.title}
              aria-label={
                cell.title
                  ? `${cell.iso} — ${cell.title}`
                  : cell.iso
              }
              onClick={() => {
                if (!cell.disabled && cell.iso) onChange(cell.iso);
              }}
              className={`h-9 rounded-lg text-sm transition ${
                cell.disabled
                  ? "cursor-not-allowed text-zinc-600 line-through opacity-50"
                  : selected
                    ? "bg-cyan/20 font-semibold text-cyan ring-1 ring-cyan/40"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-zinc-500">
        Sundays and workshop holidays are unavailable.
      </p>
    </div>
  );
}
