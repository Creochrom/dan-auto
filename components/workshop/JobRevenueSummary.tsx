"use client";

import type { Job } from "@/lib/types/job";
import { formatPenceDisplay } from "@/lib/workshop/job-revenue";

type Props = {
  job: Pick<
    Job,
    "estimatedValuePence" | "approvedQuotePence" | "finalInvoicePence"
  >;
  compact?: boolean;
  className?: string;
};

export function JobRevenueSummary({ job, compact = false, className = "" }: Props) {
  const rows = [
    { label: "Estimate", value: job.estimatedValuePence },
    { label: "Approved quote", value: job.approvedQuotePence },
    { label: "Final invoice", value: job.finalInvoicePence },
  ];

  if (compact) {
    const filled = rows.filter((r) => r.value != null);
    if (filled.length === 0) {
      return (
        <p className={`text-[10px] text-zinc-600 ${className}`.trim()}>No values set</p>
      );
    }
    return (
      <p className={`text-[10px] text-zinc-500 ${className}`.trim()}>
        {filled.map((r) => `${r.label}: ${formatPenceDisplay(r.value)}`).join(" · ")}
      </p>
    );
  }

  return (
    <dl
      className={`grid grid-cols-3 gap-2 text-center ${className}`.trim()}
      aria-label="Job revenue values"
    >
      {rows.map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-2">
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </dt>
          <dd className="mt-1 text-xs font-medium tabular-nums text-[#e8d5a3]">
            {formatPenceDisplay(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
