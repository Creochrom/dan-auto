"use client";

import { ClipboardList } from "lucide-react";
import type { VehicleReport } from "@/lib/types/vehicle-report";

type Props = {
  report: VehicleReport;
};

export function HeroMotTimelineCard({ report }: Props) {
  return (
    <div className="hero-report-panel w-full">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4a63c]">
        <ClipboardList className="h-3.5 w-3.5" aria-hidden />
        MOT history
      </p>
      <ol className="relative mt-3 space-y-0 border-l border-[#d4a63c]/20 pl-3.5">
        {report.motHistory.map((entry, i) => (
          <li key={`${entry.date}-${i}`} className="relative pb-3 last:pb-0">
            <span
              className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-[#d4a63c]/70 ring-2 ring-[#080706]"
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-200">{entry.date}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  entry.result === "PASS"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-red-500/15 text-red-300"
                }`}
              >
                {entry.result}
              </span>
              {entry.mileage > 0 && (
                <span className="text-[10px] text-zinc-500">
                  {entry.mileage.toLocaleString("en-GB")} mi
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] leading-snug text-zinc-500">
              {entry.advisories.join(" · ")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
