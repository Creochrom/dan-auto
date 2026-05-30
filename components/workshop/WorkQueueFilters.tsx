"use client";

import type { WorkQueueFilter } from "@/lib/workshop/work-queue";

const FILTERS: Array<{ id: WorkQueueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "on_ramp", label: "On ramp" },
  { id: "waiting_customer", label: "Waiting customer" },
  { id: "waiting_parts", label: "Waiting parts" },
  { id: "ready", label: "Ready collection" },
];

type Props = {
  value: WorkQueueFilter;
  onChange: (filter: WorkQueueFilter) => void;
  counts: Record<WorkQueueFilter, number>;
};

export function WorkQueueFilters({ value, onChange, counts }: Props) {
  return (
    <div
      className="mb-4 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter vehicle queue"
    >
      {FILTERS.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              active
                ? "bg-[#d4a63c]/15 text-[#d4a63c] ring-1 ring-[#d4a63c]/35"
                : "border border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                active ? "bg-[#d4a63c]/20 text-[#e8d5a3]" : "bg-white/5 text-zinc-500"
              }`}
            >
              {counts[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
