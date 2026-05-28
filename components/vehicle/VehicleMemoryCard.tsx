"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin/client";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";
import { formatMotDueDate } from "@/lib/vehicle-mot-display";

type Props = {
  memory: VehicleMemoryLookupResult;
  registration: string;
  onRefreshed?: () => void;
};

function makeModelLabel(memory: VehicleMemoryLookupResult): string | null {
  const v = memory.vehicle;
  if (!v) return null;
  const parts = [v.year, v.make, v.model].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

function intakeDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function VehicleMemoryCard({ memory, registration, onRefreshed }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const makeModel = makeModelLabel(memory);
  const lastIntake = memory.recentIntakes[0];
  const motExpiry = memory.vehicle?.motExpiryDate
    ? formatMotDueDate(memory.vehicle.motExpiryDate, 0)
    : null;
  const phone = memory.customer?.phone?.trim();

  async function refreshFromDvla() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await adminFetch(
        `/api/vehicle-lookup?reg=${encodeURIComponent(registration)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "DVLA lookup failed");
      }
      onRefreshed?.();
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="premium-card rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Vehicle memory
          </p>
          {memory.returning ? (
            <span className="mt-2 inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Returning
            </span>
          ) : (
            <div className="mt-2">
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                First visit in memory
              </span>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                No prior intakes on file. A DVLA check on the public site or below
                seeds make, model, and MOT for the next visit.
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refreshFromDvla()}
          disabled={refreshing}
          className="min-h-[44px] shrink-0 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-4 py-2.5 text-sm font-medium text-[#d4a63c] hover:border-[#d4a63c]/55 disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh from DVLA"}
        </button>
      </div>

      {refreshError && (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {refreshError}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Vehicle</p>
          {makeModel ? (
            <p className="mt-1 text-base font-medium text-white">{makeModel}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">No make/model in memory yet</p>
          )}
          {memory.vehicle?.fuel && (
            <p className="mt-1 text-xs text-zinc-400">{memory.vehicle.fuel}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">MOT expiry</p>
          {motExpiry ? (
            <p className="mt-1 text-base font-medium text-white">{motExpiry}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">Not in memory — refresh from DVLA</p>
          )}
          {memory.vehicle?.motStatus && (
            <p className="mt-1 text-xs text-zinc-400">{memory.vehicle.motStatus}</p>
          )}
        </div>

        {memory.returning && (
          <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Customer</p>
            {memory.customer?.name && (
              <p className="mt-1 text-sm text-white">{memory.customer.name}</p>
            )}
            {phone ? (
              <a
                href={phoneHref(phone)}
                className="mt-2 inline-flex min-h-[44px] items-center text-base font-medium text-[#d4a63c] hover:underline"
              >
                {phone}
              </a>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">No phone on file</p>
            )}
          </div>
        )}

        {lastIntake && (
          <div
            className={`rounded-xl border border-white/[0.08] bg-black/25 p-4 ${
              memory.returning ? "" : "sm:col-span-2"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Last intake</p>
            <p className="mt-1 text-xs text-zinc-500">{intakeDateLabel(lastIntake.at)}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">{lastIntake.summary}</p>
            {lastIntake.urgency && (
              <p className="mt-2 text-xs text-zinc-400">Urgency: {lastIntake.urgency}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
