"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Loader2, Phone } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { TodayOperationalKpiStrip } from "@/components/workshop/TodayOperationalKpiStrip";
import { VehicleWorkQueueCard } from "@/components/workshop/VehicleWorkQueueCard";
import { WorkQueueFilters } from "@/components/workshop/WorkQueueFilters";
import type { Booking } from "@/lib/types/booking";
import type { Job } from "@/lib/types/job";
import type { MotQueueByBucket } from "@/lib/workshop/mot-queue";
import {
  computeRevenuePipeline,
} from "@/lib/workshop/revenue-pipeline";
import {
  buildWorkQueue,
  countWorkQueueByFilter,
  filterWorkQueue,
  type WorkQueueFilter,
} from "@/lib/workshop/work-queue";
import { computeTodayOperationalKpis } from "@/lib/workshop/today-operational-kpis";
import { filterCollectedJobs } from "@/lib/workshop/completed-jobs";
import { resolveJobsFromResponse } from "@/lib/workshop/resolve-jobs-response";
import { formatPipelineGbp } from "@/lib/workshop/revenue-pipeline";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types/job";

type JobsResponse = { ok?: boolean; data?: Job[] | { jobs?: Job[] }; error?: string };
type BookingsResponse = { ok?: boolean; data?: Booking[]; error?: string };
type MotQueueResponse = {
  ok?: boolean;
  data?: { buckets?: MotQueueByBucket };
  error?: string;
};

const MOT_BUCKET_DAYS = [30, 14, 7] as const;
type MotBucketDays = (typeof MOT_BUCKET_DAYS)[number];

const MOT_BUCKET_LABELS: Record<MotBucketDays, string> = {
  30: "Within 30 days",
  14: "Within 14 days",
  7: "Within 7 days",
};

export default function AdminTodayPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [motBuckets, setMotBuckets] = useState<MotQueueByBucket>({
    overdue: [],
    30: [],
    14: [],
    7: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<WorkQueueFilter>("all");
  const [pendingConfirmId, setPendingConfirmId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<Record<string, "idle" | "copied" | "error">>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, bookingsRes, motQueueRes] = await Promise.all([
        adminFetch("/api/jobs", { credentials: "include" }),
        adminFetch("/api/bookings", { credentials: "include" }),
        adminFetch("/api/admin/mot-queue", { credentials: "include" }),
      ]);

      if (jobsRes.status === 401 || bookingsRes.status === 401 || motQueueRes.status === 401) {
        router.replace("/admin/login?from=/admin/today");
        return;
      }

      const jobsJson = (await jobsRes.json().catch(() => null)) as JobsResponse | null;
      const bookingsJson = (await bookingsRes.json().catch(() => null)) as
        | BookingsResponse
        | null;
      const motQueueJson = (await motQueueRes.json().catch(() => null)) as
        | MotQueueResponse
        | null;

      if (
        !jobsRes.ok ||
        !jobsJson?.ok ||
        !bookingsRes.ok ||
        !bookingsJson?.ok ||
        !motQueueRes.ok ||
        !motQueueJson?.ok
      ) {
        throw new Error("Could not load today queue.");
      }

      setJobs(resolveJobsFromResponse(jobsJson));
      setBookings(Array.isArray(bookingsJson.data) ? bookingsJson.data : []);
      setMotBuckets(
        motQueueJson.data?.buckets ?? {
          overdue: [],
          30: [],
          14: [],
          7: [],
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load today queue.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    if (window.location.hash !== "#mot") return;
    document.getElementById("mot")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const workQueue = useMemo(
    () => buildWorkQueue(bookings, jobs),
    [bookings, jobs]
  );

  const filteredQueue = useMemo(
    () => filterWorkQueue(workQueue, queueFilter),
    [workQueue, queueFilter]
  );

  const filterCounts = useMemo(
    () => countWorkQueueByFilter(workQueue),
    [workQueue]
  );

  const operationalKpis = useMemo(
    () => computeTodayOperationalKpis(jobs),
    [jobs]
  );

  const revenuePipeline = useMemo(
    () => computeRevenuePipeline({ jobs }),
    [jobs]
  );

  const collectedJobs = useMemo(
    () => filterCollectedJobs(jobs, { updatedToday: true }),
    [jobs]
  );

  const formatCollectedTime = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });

  const totalMotQueueCount = useMemo(
    () =>
      motBuckets.overdue.length +
      motBuckets[30].length +
      motBuckets[14].length +
      motBuckets[7].length,
    [motBuckets]
  );

  const confirmBooking = useCallback(
    async (bookingId: string) => {
      setPendingConfirmId(bookingId);
      try {
        const res = await adminFetch("/api/bookings", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: bookingId, status: "confirmed" }),
        });

        if (res.status === 401) {
          router.replace("/admin/login?from=/admin/today");
          return;
        }

        const json = (await res.json().catch(() => null)) as
          | {
              ok?: boolean;
              data?: { booking?: Booking; job?: { id: string } };
              error?: string;
            }
          | null;
        const updated = json?.data?.booking;
        if (!res.ok || !json?.ok || !updated) {
          throw new Error(json?.error ?? "Could not confirm booking.");
        }

        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? updated : b))
        );

        if (json.data?.job?.id) {
          const jobsRes = await adminFetch("/api/jobs", { credentials: "include" });
          const jobsJson = (await jobsRes.json().catch(() => null)) as JobsResponse | null;
          if (jobsRes.ok && jobsJson?.ok) {
            setJobs(resolveJobsFromResponse(jobsJson));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not confirm booking.");
      } finally {
        setPendingConfirmId(null);
      }
    },
    [router]
  );

  const copyDraftForVehicle = useCallback(
    async ({
      regDisplay,
      daysToExpiry,
      dueDateLabel,
      customerName,
    }: {
      regDisplay: string;
      daysToExpiry: number;
      dueDateLabel: string;
      customerName?: string;
    }) => {
      const draft =
        daysToExpiry < 0
          ? [
              `Hi${customerName?.trim() ? ` ${customerName.trim()}` : ""},`,
              "",
              `Quick reminder from Dan Auto Centre: your MOT for ${regDisplay} expired ${Math.abs(daysToExpiry)} days ago (${dueDateLabel}).`,
              "Would you like us to get this booked in urgently?",
            ].join("\n")
          : [
              `Hi${customerName?.trim() ? ` ${customerName.trim()}` : ""},`,
              "",
              `Quick reminder from Dan Auto Centre: your MOT for ${regDisplay} is due in ${daysToExpiry} days (${dueDateLabel}).`,
              "Would you like us to get this booked in?",
            ].join("\n");

      try {
        await navigator.clipboard.writeText(draft);
        setCopyState((prev) => ({ ...prev, [regDisplay]: "copied" }));
        setTimeout(() => {
          setCopyState((prev) => ({ ...prev, [regDisplay]: "idle" }));
        }, 1800);
      } catch {
        setCopyState((prev) => ({ ...prev, [regDisplay]: "error" }));
      }
    },
    []
  );

  return (
    <main className="admin-content-wrap pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Today</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Workshop floor · vehicles first
          </p>
        </div>
        <Link href="/admin/jobs" className="text-sm text-[#d4a63c] hover:underline">
          Open Jobs cockpit →
        </Link>
      </div>

      <AdminQuickLinks active="today" />

      <TodayOperationalKpiStrip
        kpis={operationalKpis}
        potentialRevenuePence={revenuePipeline.potentialPence}
        loading={loading}
      />

      <section className="mb-8" aria-label="Vehicle work queue">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Vehicle work queue</h2>
            <p className="mt-1 text-xs text-zinc-500">
              One card per vehicle · call, open job, or confirm
            </p>
          </div>
          <span className="text-xs text-zinc-500">{filteredQueue.length} shown</span>
        </div>

        <WorkQueueFilters
          value={queueFilter}
          onChange={setQueueFilter}
          counts={filterCounts}
        />

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading queue…
          </div>
        ) : error ? (
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
        ) : filteredQueue.length === 0 ? (
          <div className="premium-card rounded-2xl p-8 text-center">
            <p className="text-sm text-zinc-300">
              {queueFilter === "all"
                ? "No vehicles in the workshop queue."
                : "No vehicles match this filter."}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Confirm a booking or check in a walk-in to add a vehicle.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredQueue.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <VehicleWorkQueueCard
                  item={item}
                  confirming={pendingConfirmId === item.id}
                  onConfirm={
                    item.kind === "booking"
                      ? () => void confirmBooking(item.id)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <details
        id="completed"
        open={collectedJobs.length > 0}
        className="premium-card group mb-8 scroll-mt-20 rounded-2xl"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-sm font-semibold text-white">Collected today</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Completed handovers · jobs remain in history and vehicle records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
              {collectedJobs.length}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>

        <div className="border-t border-white/[0.06] p-4 pt-0">
          {loading ? (
            <p className="mt-4 text-xs text-zinc-500">Loading collected jobs…</p>
          ) : collectedJobs.length === 0 ? (
            <p className="mt-4 text-xs text-zinc-500">
              No vehicles collected today yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {collectedJobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#e8d5a3]">
                      {job.registration}
                    </p>
                    <p className="text-xs text-zinc-400">{job.service}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {JOB_STATUS_LABELS[job.status as JobStatus]} ·{" "}
                      {formatCollectedTime(job.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    {job.finalInvoicePence != null ? (
                      <p className="text-sm tabular-nums text-emerald-200">
                        {formatPipelineGbp(job.finalInvoicePence)}
                      </p>
                    ) : null}
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-xs text-[#d4a63c] hover:underline"
                    >
                      Open job →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <details id="mot" className="premium-card group scroll-mt-20 rounded-2xl">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-sm font-semibold text-white">MOT queue</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Secondary · overdue and upcoming MOT reminders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
              {totalMotQueueCount} queued
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>

        <div className="border-t border-white/[0.06] p-4 pt-0">
          <section className="mb-4 mt-4 rounded-xl border border-rose-500/45 bg-rose-500/10 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-200">
                Overdue MOT
              </h3>
              <span className="rounded-full border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-100">
                {motBuckets.overdue.length}
              </span>
            </div>
            {motBuckets.overdue.length === 0 ? (
              <p className="text-xs text-rose-200/50">No overdue MOTs.</p>
            ) : (
              <ul className="space-y-2">
                {motBuckets.overdue.map((vehicle) => {
                  const state = copyState[vehicle.regDisplay] ?? "idle";
                  const daysOverdue = Math.abs(vehicle.daysToExpiry);
                  return (
                    <li
                      key={`overdue-${vehicle.reg}`}
                      className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-sm font-semibold text-[#e8d5a3]">
                              {vehicle.regDisplay}
                            </p>
                            <span className="rounded-full border border-rose-400/50 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                              {daysOverdue}d overdue
                            </span>
                          </div>
                          {vehicle.makeModel ? (
                            <p className="text-xs text-rose-100/80">{vehicle.makeModel}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-rose-200/90">
                            MOT expired {vehicle.dueDateLabel}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void copyDraftForVehicle({
                                regDisplay: vehicle.regDisplay,
                                daysToExpiry: vehicle.daysToExpiry,
                                dueDateLabel: vehicle.dueDateLabel,
                                customerName: vehicle.customerName,
                              })
                            }
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-2 text-[11px] text-rose-100 hover:border-rose-300/60"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {state === "copied"
                              ? "Copied"
                              : state === "error"
                                ? "Copy failed"
                                : "Copy draft"}
                          </button>
                          {vehicle.customerPhone ? (
                            <a
                              href={`tel:${vehicle.customerPhone.replace(/\s+/g, "")}`}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-2 text-[11px] text-rose-100 hover:border-rose-300/60"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            {MOT_BUCKET_DAYS.map((days) => (
              <section
                key={days}
                className="rounded-xl border border-white/[0.08] bg-black/25 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300">
                    {MOT_BUCKET_LABELS[days]}
                  </h3>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                    {motBuckets[days].length}
                  </span>
                </div>
                {motBuckets[days].length === 0 ? (
                  <p className="text-xs text-zinc-600">No vehicles in this window.</p>
                ) : (
                  <ul className="space-y-2">
                    {motBuckets[days].map((vehicle) => {
                      const state = copyState[vehicle.regDisplay] ?? "idle";
                      return (
                        <li
                          key={`${days}-${vehicle.reg}`}
                          className="rounded-xl border border-white/[0.08] bg-black/35 px-3 py-3"
                        >
                          <p className="font-mono text-sm font-semibold text-[#e8d5a3]">
                            {vehicle.regDisplay}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            MOT due {vehicle.dueDateLabel}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              void copyDraftForVehicle({
                                regDisplay: vehicle.regDisplay,
                                daysToExpiry: vehicle.daysToExpiry,
                                dueDateLabel: vehicle.dueDateLabel,
                                customerName: vehicle.customerName,
                              })
                            }
                            className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[11px] text-zinc-200 hover:border-white/30"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {state === "copied" ? "Copied" : "Copy draft"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </details>
    </main>
  );
}
