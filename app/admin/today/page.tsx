"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Phone } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { AdminStatusBadge } from "@/components/enterprise/AdminStatusBadge";
import type { Booking } from "@/lib/types/booking";
import type { Job } from "@/lib/types/job";
import {
  TODAY_COLUMNS,
  computeTodayOwnerCounts,
  groupJobsByTodayColumn,
  isActiveFloorJob,
} from "@/lib/workshop/today-queue";
import type { MotQueueByBucket } from "@/lib/workshop/mot-queue";

type JobsResponse = { ok?: boolean; data?: Job[]; error?: string };
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

function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

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

      setJobs(Array.isArray(jobsJson.data) ? jobsJson.data : []);
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

  const floorJobs = useMemo(
    () => jobs.filter((j) => isActiveFloorJob(j.status)),
    [jobs]
  );

  const columns = useMemo(() => groupJobsByTodayColumn(floorJobs), [floorJobs]);
  const ownerCounts = useMemo(() => computeTodayOwnerCounts(jobs), [jobs]);

  const callbackCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "new" || b.status === "awaiting_callback"
      ).length,
    [bookings]
  );

  const tomorrowCount = useMemo(() => {
    const tomorrow = tomorrowIsoDate();
    return bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        b.preferredDate.startsWith(tomorrow)
    ).length;
  }, [bookings]);

  const totalMotQueueCount = useMemo(
    () =>
      motBuckets.overdue.length +
      motBuckets[30].length +
      motBuckets[14].length +
      motBuckets[7].length,
    [motBuckets]
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
        setCopyState((prev) => ({
          ...prev,
          [regDisplay]: "copied",
        }));
        setTimeout(() => {
          setCopyState((prev) => ({
            ...prev,
            [regDisplay]: "idle",
          }));
        }, 1800);
      } catch {
        setCopyState((prev) => ({
          ...prev,
          [regDisplay]: "error",
        }));
      }
    },
    []
  );

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Today</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Floor queue · tap a job to open details
          </p>
        </div>
        <Link href="/admin/jobs" className="text-sm text-[#d4a63c] hover:underline">
          Open Jobs cockpit →
        </Link>
      </div>

      <AdminQuickLinks active="today" />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="premium-card rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            On ramp
          </p>
          <p className="mt-1 text-2xl font-light text-white">{ownerCounts.onRamp}</p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Stuck
          </p>
          <p className="mt-1 text-2xl font-light text-white">
            {ownerCounts.waitingParts + ownerCounts.waitingCustomer}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {ownerCounts.waitingParts} parts · {ownerCounts.waitingCustomer} customer
          </p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Ready
          </p>
          <p className="mt-1 text-2xl font-light text-[#d4a63c]">
            {ownerCounts.ready}
          </p>
        </div>
        <div className="premium-card rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Callbacks · tomorrow
          </p>
          <p className="mt-1 text-2xl font-light text-white">{callbackCount}</p>
          <p className="mt-1 text-xs text-zinc-500">{tomorrowCount} confirmed tomorrow</p>
        </div>
      </section>

      <section id="mot" className="premium-card mb-6 scroll-mt-20 rounded-2xl p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">MOT queue</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Overdue MOTs plus due within 30, 14, or 7 days. Drafts are copy-only (human sends).
            </p>
          </div>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
            {totalMotQueueCount} queued
          </span>
        </div>

        <section className="mb-4 rounded-xl border border-rose-500/45 bg-rose-500/10 p-3">
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
                        {vehicle.customerName ? (
                          <p className="mt-1 text-[11px] text-rose-200/70">
                            Customer: {vehicle.customerName}
                          </p>
                        ) : null}
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
                        <Link
                          href={`/admin/bookings?reg=${encodeURIComponent(vehicle.regDisplay)}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/50 px-3 py-2 text-[11px] text-rose-100 hover:border-rose-300/70"
                        >
                          Book MOT
                        </Link>
                        <Link
                          href={`/admin/vehicle/${encodeURIComponent(vehicle.regDisplay)}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-2 text-[11px] text-rose-100 hover:border-rose-300/60"
                        >
                          View history
                        </Link>
                        <Link
                          href={`/admin/workshop-assistant?reg=${encodeURIComponent(vehicle.regDisplay)}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/40 px-3 py-2 text-[11px] text-rose-100 hover:border-rose-300/60"
                        >
                          Ask assistant
                        </Link>
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
            <section key={days} className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
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
                    const isUrgent = days === 7 && vehicle.daysToExpiry < 3;
                    return (
                      <li
                        key={`${days}-${vehicle.reg}`}
                        className={
                          isUrgent
                            ? "rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-3"
                            : "rounded-xl border border-white/[0.08] bg-black/35 px-3 py-3"
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-semibold text-[#e8d5a3]">
                                {vehicle.regDisplay}
                              </p>
                              {isUrgent ? (
                                <span className="rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-200">
                                  {vehicle.daysToExpiry <= 0
                                    ? "Due now"
                                    : `${vehicle.daysToExpiry}d left`}
                                </span>
                              ) : null}
                            </div>
                            {vehicle.makeModel ? (
                              <p className="text-xs text-zinc-400">{vehicle.makeModel}</p>
                            ) : null}
                            <p
                              className={
                                isUrgent
                                  ? "mt-1 text-[11px] text-rose-200/90"
                                  : "mt-1 text-[11px] text-zinc-500"
                              }
                            >
                              MOT due {vehicle.dueDateLabel}
                              {isUrgent ? ` · ${vehicle.daysToExpiry} days` : null}
                            </p>
                            {vehicle.customerName ? (
                              <p className="mt-1 text-[11px] text-zinc-500">
                                Customer: {vehicle.customerName}
                              </p>
                            ) : null}
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
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[11px] text-zinc-200 hover:border-white/30"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {state === "copied"
                                ? "Copied"
                                : state === "error"
                                  ? "Copy failed"
                                  : "Copy draft"}
                            </button>
                            <Link
                              href={`/admin/bookings?reg=${encodeURIComponent(vehicle.regDisplay)}`}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#d4a63c]/30 px-3 py-2 text-[11px] text-[#d4a63c] hover:border-[#d4a63c]/50"
                            >
                              Book MOT
                            </Link>
                            <Link
                              href={`/admin/vehicle/${encodeURIComponent(vehicle.regDisplay)}`}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[11px] text-zinc-200 hover:border-white/30"
                            >
                              View history
                            </Link>
                            <Link
                              href={`/admin/workshop-assistant?reg=${encodeURIComponent(vehicle.regDisplay)}`}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-cyan/25 px-3 py-2 text-[11px] text-cyan hover:border-cyan/40"
                            >
                              Ask assistant
                            </Link>
                            {vehicle.customerPhone ? (
                              <a
                                href={`tel:${vehicle.customerPhone.replace(/\s+/g, "")}`}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[11px] text-zinc-200 hover:border-white/30"
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
          ))}
        </div>
      </section>

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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TODAY_COLUMNS.filter((c) => c.id !== "done").map((col) => (
            <section
              key={col.id}
              className="premium-card flex min-h-[12rem] flex-col rounded-2xl p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">{col.label}</h2>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                  {columns[col.id].length}
                </span>
              </div>
              <ul className="flex flex-1 flex-col gap-2">
                {columns[col.id].length === 0 ? (
                  <li className="text-xs text-zinc-600">—</li>
                ) : (
                  columns[col.id].map((job) => (
                    <li key={job.id}>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="block rounded-xl border border-white/[0.06] bg-black/30 px-3 py-3 transition hover:border-[#d4a63c]/30"
                      >
                        <p className="font-mono text-sm font-semibold text-[#e8d5a3]">
                          {job.registration}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          {job.service}
                        </p>
                        <div className="mt-1">
                          <AdminStatusBadge kind="job" status={job.status} />
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && floorJobs.length === 0 && !error && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          No active jobs on the floor. Confirm a booking to create a job card.
        </p>
      )}
    </main>
  );
}
