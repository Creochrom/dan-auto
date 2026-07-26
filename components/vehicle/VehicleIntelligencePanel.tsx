"use client";

import Link from "next/link";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import { deriveVehicleInsights } from "@/lib/vehicle/derive-vehicle-insights";

type Props = {
  report: VehicleReport;
  registration: string;
  assistantHref?: string;
};

/**
 * Workshop-facing DVLA/MOT intelligence — full detail for bay and front desk.
 */
export function VehicleIntelligencePanel({
  report,
  registration,
  assistantHref,
}: Props) {
  const insights = deriveVehicleInsights(report);

  return (
    <section className="premium-card space-y-4 rounded-2xl p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan">
          Vehicle intelligence
        </p>
        <h3 className="mt-1 text-sm font-semibold text-white">{report.profile.makeModel}</h3>
        <p className="text-xs text-zinc-500">
          {report.reg} · {report.profile.engine}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">MOT</p>
          <p className="mt-1 text-xs text-zinc-200">{report.profile.motStatus}</p>
          {insights.motExpiryLabel && (
            <p className="mt-1 text-xs text-zinc-400">Expires {insights.motExpiryLabel}</p>
          )}
          {insights.motDueDays !== null && insights.motDueDays <= 30 && insights.motDueDays > 0 && (
            <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
              MOT due in {insights.motDueDays} days — reminder candidate
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tax & mileage</p>
          <p className="mt-1 text-xs text-zinc-200">{insights.taxLabel}</p>
          {insights.lastMileage ? (
            <p className="mt-1 text-xs text-zinc-400">
              Last MOT {insights.lastMileage.toLocaleString("en-GB")} mi · {insights.mileageTrend}
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">Mileage not in MOT feed</p>
          )}
        </div>
      </div>

      {insights.discussionPoints.length > 0 && (
        <div className="rounded-xl border border-[#d4a63c]/20 bg-[#d4a63c]/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d4a63c]">
            Likely discussion points
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-zinc-200">
            {insights.discussionPoints.map((point) => (
              <li key={point}>· {point}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.motHealthSummary.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            MOT health summary
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-zinc-200">
            {insights.motHealthSummary.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.failureItems.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-red-300">
            Last MOT failures ({insights.defectCount})
          </p>
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-zinc-300">
            {insights.failureItems.map((item) => (
              <li key={item} className="leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.advisoryItems.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Last MOT advisories ({insights.advisoryCount})
          </p>
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-zinc-300">
            {insights.advisoryItems.map((item) => (
              <li key={item} className="leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.upsellHints.length > 0 && (
        <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-cyan">Workshop hints</p>
          <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
            {insights.upsellHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {report.motHistory.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">MOT history</p>
          <ol className="mt-2 space-y-2">
            {report.motHistory.slice(0, 4).map((entry, i) => (
              <li key={`${entry.date}-${i}`} className="text-xs text-zinc-400">
                <span className="text-zinc-200">{entry.date}</span> · {entry.result}
                {entry.mileage > 0 ? ` · ${entry.mileage.toLocaleString("en-GB")} mi` : ""}
                {entry.advisories.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-zinc-500">{entry.advisories.join(" · ")}</p>
                  )}
                {entry.failures.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-red-300/80">{entry.failures.join(" · ")}</p>
                  )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {assistantHref && (
          <Link
            href={assistantHref}
            className="rounded-full border border-cyan/35 px-3 py-1.5 text-cyan hover:bg-cyan/10"
          >
            Ask copilot →
          </Link>
        )}
        <Link
          href={`/admin/vehicle/${encodeURIComponent(registration)}`}
          className="rounded-full border border-white/15 px-3 py-1.5 text-zinc-300 hover:border-white/30"
        >
          Full history →
        </Link>
      </div>
    </section>
  );
}
