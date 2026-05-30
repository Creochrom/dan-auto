"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useVehicleReport } from "@/hooks/useVehicleReport";
import { deriveVehicleInsights } from "@/lib/vehicle/derive-vehicle-insights";

type Props = {
  registration: string;
  /** When true, load DVLA data immediately (no extra tap). */
  autoLoad?: boolean;
};

/** Lazy DVLA pre-check for front desk — loads on demand to save API calls. */
export function BookingVehiclePrecheck({ registration, autoLoad = false }: Props) {
  const [open, setOpen] = useState(autoLoad);
  const { report, loading, error } = useVehicleReport(open ? registration : null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-cyan/25 bg-cyan/5 px-3 py-2 text-left text-xs font-medium text-cyan hover:border-cyan/40"
      >
        Load vehicle pre-check (DVLA + MOT)
      </button>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading vehicle data…
      </div>
    );
  }

  if (error || !report) {
    return (
      <p className="mt-3 text-xs text-amber-200/90">
        {error ?? "Could not load vehicle data. Check DVLA_API_KEY in /admin/health."}
      </p>
    );
  }

  const insights = deriveVehicleInsights(report);

  return (
    <div className="mt-3 rounded-xl border border-[#d4a63c]/20 bg-[#d4a63c]/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d4a63c]">
        Pre-check · {report.profile.makeModel}
      </p>
      <ul className="mt-2 space-y-1 text-xs text-zinc-200">
        {insights.discussionPoints.map((point) => (
          <li key={point}>· {point}</li>
        ))}
      </ul>
    </div>
  );
}
