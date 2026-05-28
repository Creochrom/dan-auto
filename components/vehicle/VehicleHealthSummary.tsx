"use client";

import type { VehicleReport } from "@/lib/types/vehicle-report";
import { getCustomerHealthLines } from "@/lib/vehicle/derive-vehicle-insights";

type Props = {
  report: VehicleReport;
  title?: string;
};

/**
 * Customer-facing vehicle snapshot — short, useful, not a DVLA dump.
 */
export function VehicleHealthSummary({ report, title = "Vehicle overview" }: Props) {
  const lines = getCustomerHealthLines(report);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {title}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{report.profile.makeModel}</p>
      <p className="text-xs text-zinc-500">
        {report.reg} · {report.profile.year} · {report.profile.fuel}
      </p>

      <ul className="mt-4 space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2 text-sm text-zinc-300">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#d4a63c]/80" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
