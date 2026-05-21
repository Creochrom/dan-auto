"use client";

import { AlertTriangle } from "lucide-react";
import type { VehicleReport } from "@/lib/types/vehicle-report";

type Props = {
  report: VehicleReport;
};

export function HeroCommonIssuesCard({ report }: Props) {
  const modelLabel = report.profile.makeModel.split(" ").slice(0, 2).join(" ");

  return (
    <div className="hero-report-panel w-full">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4a63c]">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Common issues for this model
      </p>
      <p className="mt-1 text-[10px] text-zinc-500">Typical on {modelLabel} — workshop intelligence</p>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {report.commonIssues.map((issue) => (
          <li
            key={issue}
            className="rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-[10px] font-medium text-amber-100/90"
          >
            {issue}
          </li>
        ))}
      </ul>
    </div>
  );
}
