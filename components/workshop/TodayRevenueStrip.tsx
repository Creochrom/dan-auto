"use client";

import {
  formatPipelineGbp,
  type RevenuePipeline,
} from "@/lib/workshop/revenue-pipeline";

type Props = {
  pipeline: RevenuePipeline;
  loading?: boolean;
};

export function TodayRevenueStrip({ pipeline, loading }: Props) {
  const tiles: Array<{ label: string; value: number; sub?: string }> = [
    { label: "Potential revenue", value: pipeline.potentialPence },
    { label: "Confirmed revenue", value: pipeline.confirmedPence },
    { label: "Completed revenue", value: pipeline.completedPence },
    {
      label: "Awaiting quote",
      value: pipeline.awaitingQuotePence,
      sub: pipeline.awaitingQuoteCount
        ? `${pipeline.awaitingQuoteCount} job${pipeline.awaitingQuoteCount === 1 ? "" : "s"}`
        : undefined,
    },
  ];

  return (
    <section className="mb-6" aria-label="Indicative revenue pipeline">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Indicative pipeline
        </p>
        <p className="text-[10px] text-zinc-600">Job-tracked values · not accounting data</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ label, value, sub }) => (
          <div
            key={label}
            className="premium-card rounded-2xl border border-[#d4a63c]/10 p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 text-xl font-light tabular-nums text-[#e8d5a3]">
              {loading ? "—" : formatPipelineGbp(value)}
            </p>
            {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
