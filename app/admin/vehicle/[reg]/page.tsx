"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import type { VehicleHistory } from "@/lib/services/vehicle-history.service";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types/job";
import { VehicleMemoryCard } from "@/components/vehicle/VehicleMemoryCard";
import { VehicleWorkshopTimeline } from "@/components/vehicle/VehicleWorkshopTimeline";

type HistoryResponse = {
  ok?: boolean;
  data?: VehicleHistory;
  error?: string;
};

function compactDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function AdminVehicleHistoryPage() {
  const params = useParams<{ reg: string }>();
  const router = useRouter();
  const regParam = params?.reg ? decodeURIComponent(params.reg) : "";

  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!regParam) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(
        `/api/vehicle-history?reg=${encodeURIComponent(regParam)}`,
        { credentials: "include" }
      );
      if (res.status === 401) {
        router.replace(`/admin/login?from=/admin/vehicle/${encodeURIComponent(regParam)}`);
        return;
      }
      const json = (await res.json().catch(() => null)) as HistoryResponse | null;
      if (!res.ok || !json?.ok || !json.data) {
        throw new Error(json?.error ?? "Could not load vehicle history.");
      }
      setHistory(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load vehicle history.");
    } finally {
      setLoading(false);
    }
  }, [regParam, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Vehicle history
          </p>
          <h1 className="mt-2 font-mono text-2xl font-semibold text-white">
            {history?.registration ?? regParam.toUpperCase()}
          </h1>
        </div>
        <Link href="/admin/today" className="text-sm text-[#d4a63c] hover:underline">
          ← Today
        </Link>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading history…</p>}

      {error && !history && (
        <div className="premium-card rounded-2xl p-6">
          <p className="text-sm text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 text-sm text-[#d4a63c] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {history && (
        <div className="space-y-6">
          <VehicleMemoryCard
            memory={
              history.memory ?? {
                returning: false,
                recentIntakes: [],
                dvlaMatched: false,
              }
            }
            registration={history.registration}
            onRefreshed={() => void load()}
          />

          <section className="premium-card rounded-2xl p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Workshop timeline</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  MOT, repairs, bookings — feeds Workshop AI for recurring faults.
                </p>
              </div>
              <Link
                href={`/admin/workshop-assistant?reg=${encodeURIComponent(history.registration)}`}
                className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-xs font-medium text-cyan hover:border-cyan/50"
              >
                Ask AI with this history
              </Link>
            </div>
            <VehicleWorkshopTimeline items={history.displayTimeline} />
          </section>

          <section className="premium-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white">Jobs</h2>
            {history.jobs.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No workshop jobs yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 hover:border-[#d4a63c]/30"
                    >
                      <span className="text-sm text-zinc-200">{job.service}</span>
                      <span className="text-xs text-zinc-500">
                        {JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status} ·{" "}
                        {compactDate(job.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="premium-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white">Bookings</h2>
            {history.bookings.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No bookings on file.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.bookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-xl border border-white/[0.06] px-3 py-2 text-sm text-zinc-300"
                  >
                    {b.service} · {b.status.replaceAll("_", " ")} · {b.preferredDate}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="premium-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white">Leads</h2>
            {history.leads.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No leads for this registration.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.leads.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-xl border border-white/[0.06] px-3 py-2 text-sm text-zinc-300"
                  >
                    {l.name} · {l.status} · {compactDate(l.createdAt)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link
            href={`/admin/workshop-assistant?reg=${encodeURIComponent(history.registration)}`}
            className="inline-flex rounded-full border border-cyan/35 bg-cyan/10 px-4 py-2 text-sm font-medium text-cyan hover:border-cyan/55"
          >
            Open Workshop Assistant
          </Link>
        </div>
      )}
    </main>
  );
}
