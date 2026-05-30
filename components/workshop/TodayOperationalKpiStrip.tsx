"use client";

import Link from "next/link";
import { formatPipelineGbp } from "@/lib/workshop/revenue-pipeline";
import type { TodayOperationalKpis } from "@/lib/workshop/today-operational-kpis";

type Props = {
  kpis: TodayOperationalKpis;
  potentialRevenuePence: number;
  loading?: boolean;
};

type OperationalTile = {
  key: keyof TodayOperationalKpis | "potentialRevenue";
  label: string;
  getCount: (kpis: TodayOperationalKpis, potentialRevenuePence: number) => number;
  getSub?: (kpis: TodayOperationalKpis, potentialRevenuePence: number) => string | null;
  emptyHint: string;
  emphasis?: "primary" | "warn" | "action" | "success";
};

const OPERATIONAL_TILES: OperationalTile[] = [
  {
    key: "carsOnSite",
    label: "Cars on site",
    getCount: (k) => k.carsOnSite,
    emptyHint: "No vehicles on the floor",
    emphasis: "primary",
  },
  {
    key: "waitingParts",
    label: "Waiting parts",
    getCount: (k) => k.waitingParts,
    emptyHint: "Nothing waiting on parts",
    emphasis: "warn",
  },
  {
    key: "awaitingApprovalCount",
    label: "Awaiting approval",
    getCount: (k) => k.awaitingApprovalCount,
    getSub: (k) =>
      k.awaitingApprovalPipelinePence > 0
        ? `${formatPipelineGbp(k.awaitingApprovalPipelinePence)} estimated`
        : null,
    emptyHint: "No quotes pending approval",
    emphasis: "action",
  },
  {
    key: "readyForCollection",
    label: "Ready for collection",
    getCount: (k) => k.readyForCollection,
    emptyHint: "Nothing ready to hand over",
    emphasis: "success",
  },
];

const EMPHASIS_STYLES: Record<
  NonNullable<OperationalTile["emphasis"]>,
  { border: string; value: string; glow?: string }
> = {
  primary: {
    border: "border-cyan/25",
    value: "text-white",
    glow: "shadow-[inset_0_1px_0_rgba(34,211,238,0.12)]",
  },
  warn: {
    border: "border-amber-500/25",
    value: "text-amber-100",
  },
  action: {
    border: "border-violet-500/25",
    value: "text-violet-100",
  },
  success: {
    border: "border-emerald-500/25",
    value: "text-emerald-100",
  },
};

function KpiCard({
  label,
  count,
  sub,
  emptyHint,
  emphasis = "primary",
  loading,
  active,
}: {
  label: string;
  count: number;
  sub?: string | null;
  emptyHint: string;
  emphasis?: OperationalTile["emphasis"];
  loading?: boolean;
  active: boolean;
}) {
  const styles = EMPHASIS_STYLES[emphasis ?? "primary"];

  return (
    <div
      className={`premium-card rounded-2xl border p-4 sm:p-5 ${styles.border} ${
        active ? styles.glow ?? "" : "opacity-95"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums sm:text-4xl ${styles.value}`}
      >
        {loading ? "—" : count}
      </p>
      {loading ? (
        <p className="mt-2 text-xs text-zinc-600">Loading…</p>
      ) : count === 0 ? (
        <p className="mt-2 text-xs text-zinc-600">{emptyHint}</p>
      ) : sub ? (
        <p className="mt-2 text-xs text-zinc-400">{sub}</p>
      ) : (
        <p className="mt-2 text-xs text-zinc-600">
          {count === 1 ? "1 job needs attention" : `${count} jobs need attention`}
        </p>
      )}
    </div>
  );
}

export function TodayOperationalKpiStrip({
  kpis,
  potentialRevenuePence,
  loading,
}: Props) {
  return (
    <section className="mb-6" aria-label="Workshop operational overview">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-white">Morning floor check</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          What needs doing now · from live job statuses
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OPERATIONAL_TILES.map((tile) => {
          const count = tile.getCount(kpis, potentialRevenuePence);
          return (
            <KpiCard
              key={tile.key}
              label={tile.label}
              count={count}
              sub={tile.getSub?.(kpis, potentialRevenuePence) ?? null}
              emptyHint={tile.emptyHint}
              emphasis={tile.emphasis}
              loading={loading}
              active={!loading && count > 0}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Potential revenue
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Sum of estimates on active jobs · secondary indicator
          </p>
        </div>
        <p className="text-lg font-light tabular-nums text-zinc-500">
          {loading ? "—" : formatPipelineGbp(potentialRevenuePence)}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80">
            Completed today
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Collected vehicles · final invoice frozen on handover
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold tabular-nums text-emerald-100">
            {loading ? "—" : kpis.collectedToday}
          </p>
          {!loading && kpis.completedRevenuePence > 0 ? (
            <p className="text-sm tabular-nums text-emerald-200/80">
              {formatPipelineGbp(kpis.completedRevenuePence)} invoiced
            </p>
          ) : null}
          <Link
            href="#completed"
            className="text-xs text-emerald-300 hover:underline"
          >
            View collected →
          </Link>
        </div>
      </div>
    </section>
  );
}
