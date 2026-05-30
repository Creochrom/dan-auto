"use client";

import type { TodayMetrics } from "@/lib/workshop/work-queue";

type Props = {
  metrics: TodayMetrics;
  loading?: boolean;
};

const TILES: Array<{
  key: keyof TodayMetrics;
  label: string;
  accent?: boolean;
}> = [
  { key: "bookingsToday", label: "Bookings today" },
  { key: "jobsInProgress", label: "Jobs in progress" },
  { key: "waitingCustomer", label: "Waiting customer" },
  { key: "waitingParts", label: "Waiting parts" },
  { key: "readyCollection", label: "Ready collection", accent: true },
];

export function TodayMetricStrip({ metrics, loading }: Props) {
  return (
    <section
      className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      aria-label="Today's workshop metrics"
    >
      {TILES.map(({ key, label, accent }) => (
        <div key={key} className="premium-card rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p
            className={`mt-1 text-2xl font-light tabular-nums ${
              accent ? "text-[#d4a63c]" : "text-white"
            }`}
          >
            {loading ? "—" : metrics[key]}
          </p>
        </div>
      ))}
    </section>
  );
}
