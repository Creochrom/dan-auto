"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Loader2, Mail, Phone, Sparkles } from "lucide-react";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { AdminStatusBadge } from "@/components/enterprise/AdminStatusBadge";
import { JobAttachmentsPanel } from "@/components/workshop/JobAttachmentsPanel";
import { JobInvoiceDraftPanel } from "@/components/workshop/JobInvoiceDraftPanel";
import { JobRevenuePanel } from "@/components/workshop/JobRevenuePanel";
import { JobRevenueSummary } from "@/components/workshop/JobRevenueSummary";
import { JobContextPanel } from "@/components/workshop/JobContextPanel";
import { WorkshopDisclosureSection } from "@/components/workshop/WorkshopDisclosureSection";
import { WalkInJobDialog } from "@/components/workshop/WalkInJobDialog";
import { displayRegistration } from "@/lib/workshop/command-palette";
import { setActiveJobContext } from "@/lib/workshop/active-job-context";
import { JobMilestoneBar } from "@/components/workshop/JobMilestoneBar";
import { JobTimelineFeed } from "@/components/workshop/JobTimelineFeed";
import { askWorkshopCopilot } from "@/features/copilot/services/copilot-client";
import { useVehicleReport } from "@/hooks/useVehicleReport";
import { adminFetch } from "@/lib/admin/client";
import type { VehicleHistory } from "@/lib/services/vehicle-history.service";
import type { WorkshopMilestoneId } from "@/lib/workshop/job-milestones";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type Job,
  type JobAttachment,
  type JobNote,
  type JobStatus,
  type JobTimelineEvent,
} from "@/lib/types/job";
import {
  TODAY_COLUMNS,
  groupJobsByTodayColumn,
} from "@/lib/workshop/today-queue";

type JobsResponse =
  | { ok?: boolean; data?: Job[]; error?: string }
  | { ok?: boolean; data?: { jobs?: Job[] }; error?: string };
type JobDetailResponse = {
  ok?: boolean;
  data?: {
    job?: Job;
    notes?: JobNote[];
    timeline?: JobTimelineEvent[];
    attachments?: JobAttachment[];
  };
  error?: string;
};
type JobPatchResponse = {
  ok?: boolean;
  data?: {
    job?: Job;
    note?: JobNote | null;
    timeline?: JobTimelineEvent[];
    attachments?: JobAttachment[];
  };
  error?: string;
};
type HistoryResponse = {
  ok?: boolean;
  data?: VehicleHistory;
  error?: string;
};

type CenterTab = "overview" | "timeline" | "photos" | "ai";

const TAB_ITEMS: Array<{ id: CenterTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Notes/Timeline" },
  { id: "photos", label: "Photos" },
  { id: "ai", label: "AI" },
];

function compactDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { resolveJobsFromResponse } from "@/lib/workshop/resolve-jobs-response";

function nextStatus(current: JobStatus): JobStatus | null {
  const index = JOB_STATUSES.indexOf(current);
  if (index === -1) return null;
  for (let i = index + 1; i < JOB_STATUSES.length; i += 1) {
    const candidate = JOB_STATUSES[i];
    if (candidate !== "cancelled") return candidate;
  }
  return null;
}

function AdminJobsCockpitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [timeline, setTimeline] = useState<JobTimelineEvent[]>([]);
  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [milestoneLoading, setMilestoneLoading] = useState<WorkshopMilestoneId | null>(
    null
  );
  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CenterTab>("overview");
  const [statusDraft, setStatusDraft] = useState<JobStatus>("booked");
  const [timelineNote, setTimelineNote] = useState("");
  const [regSearch, setRegSearch] = useState("");
  const [draftingCustomer, setDraftingCustomer] = useState(false);
  const [customerDraft, setCustomerDraft] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInReg, setWalkInReg] = useState("");
  const { report: vehicleReport, loading: vehicleLoading, error: vehicleError } =
    useVehicleReport(selectedJob?.registration);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jobsRes = await adminFetch("/api/jobs?date=today", {
        credentials: "include",
      });
      if (jobsRes.status === 401) {
        router.replace("/admin/login?from=/admin/jobs");
        return;
      }
      const jobsJson = (await jobsRes.json().catch(() => null)) as JobsResponse | null;
      if (!jobsRes.ok || !jobsJson?.ok) {
        throw new Error(jobsJson?.error ?? "Could not load today jobs.");
      }
      const rows = resolveJobsFromResponse(jobsJson);
      setJobs(rows);
      setSelectedJobId((prev) => prev || rows[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load today jobs.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadSelectedJob = useCallback(
    async (jobId: string) => {
      if (!jobId) {
        setSelectedJob(null);
        setNotes([]);
        setTimeline([]);
        setAttachments([]);
        setStatusDraft("booked");
        setCustomerDraft("");
        return;
      }

      setError(null);
      try {
        const res = await adminFetch(`/api/jobs/${jobId}`, { credentials: "include" });
        if (res.status === 401) {
          router.replace("/admin/login?from=/admin/jobs");
          return;
        }
        const json = (await res.json().catch(() => null)) as JobDetailResponse | null;
        if (!res.ok || !json?.ok || !json.data?.job) {
          throw new Error(json?.error ?? "Unable to load selected job.");
        }
        setSelectedJob(json.data.job);
        setStatusDraft(json.data.job.status);
        setNotes(Array.isArray(json.data.notes) ? json.data.notes : []);
        setTimeline(Array.isArray(json.data.timeline) ? json.data.timeline : []);
        setAttachments(
          Array.isArray(json.data.attachments) ? json.data.attachments : []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load selected job.");
      }
    },
    [router]
  );

  const loadVehicleHistory = useCallback(async (registration: string) => {
    if (!registration) {
      setHistory(null);
      setHistoryError(null);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await adminFetch(
        `/api/vehicle-history?reg=${encodeURIComponent(registration)}`,
        { credentials: "include" }
      );
      const json = (await res.json().catch(() => null)) as HistoryResponse | null;
      if (!res.ok || !json?.ok || !json.data) {
        throw new Error(json?.error ?? "Unable to load vehicle history.");
      }
      setHistory(json.data);
    } catch (err) {
      setHistory(null);
      setHistoryError(
        err instanceof Error ? err.message : "Unable to load vehicle history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const fromUrl = searchParams.get("job");
    if (fromUrl) setSelectedJobId(fromUrl);
    const reg = searchParams.get("reg");
    if (reg) setRegSearch(displayRegistration(reg));
    if (searchParams.get("walkIn") === "1") {
      setWalkInReg(reg ?? "");
      setWalkInOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadSelectedJob(selectedJobId);
  }, [loadSelectedJob, selectedJobId]);

  useEffect(() => {
    void loadVehicleHistory(selectedJob?.registration ?? "");
  }, [loadVehicleHistory, selectedJob?.registration]);

  useEffect(() => {
    if (!selectedJob) return;
    setActiveJobContext({
      id: selectedJob.id,
      registration: selectedJob.registration,
      customerName: selectedJob.customerName,
      customerPhone: selectedJob.customerPhone,
      service: selectedJob.service,
      status: selectedJob.status,
    });
  }, [selectedJob]);

  useEffect(() => {
    const onJobUpdated = () => {
      if (selectedJobId) void loadSelectedJob(selectedJobId);
      void loadJobs();
    };
    window.addEventListener("workshop:job-updated", onJobUpdated);
    return () => window.removeEventListener("workshop:job-updated", onJobUpdated);
  }, [loadJobs, loadSelectedJob, selectedJobId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        event.key !== "/" ||
        event.defaultPrevented ||
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredJobs = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) =>
      `${job.registration} ${job.customerName} ${job.service}`
        .toLowerCase()
        .includes(q)
    );
  }, [jobs, regSearch]);
  const queueColumns = useMemo(
    () => groupJobsByTodayColumn(filteredJobs),
    [filteredJobs]
  );
  const primaryNext = selectedJob ? nextStatus(selectedJob.status) : null;

  const patchJob = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!selectedJob) return;
      setSaving(true);
      setError(null);
      try {
        const res = await adminFetch(`/api/jobs/${selectedJob.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => null)) as JobPatchResponse | null;
        if (!res.ok || !json?.ok || !json.data?.job) {
          throw new Error(json?.error ?? "Could not update job.");
        }

        const updated = json.data.job;
        setSelectedJob(updated);
        setStatusDraft(updated.status);
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        if (json.data.note) {
          setNotes((prev) => [...prev, json.data!.note!]);
        }
        if (json.data.timeline) setTimeline(json.data.timeline);
        if (json.data.attachments) setAttachments(json.data.attachments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update job.");
      } finally {
        setSaving(false);
      }
    },
    [selectedJob]
  );

  const applyJobDetails = useCallback(
    (data: {
      job?: Job;
      notes?: JobNote[];
      timeline?: JobTimelineEvent[];
      attachments?: JobAttachment[];
    }) => {
      if (data.job) {
        setSelectedJob(data.job);
        setStatusDraft(data.job.status);
        setJobs((prev) => prev.map((j) => (j.id === data.job!.id ? data.job! : j)));
      }
      if (data.notes) setNotes(data.notes);
      if (data.timeline) setTimeline(data.timeline);
      if (data.attachments) setAttachments(data.attachments);
    },
    []
  );

  const handleMilestone = useCallback(
    async (milestone: WorkshopMilestoneId) => {
      if (!selectedJob) return;
      setMilestoneLoading(milestone);
      setError(null);
      try {
        const res = await adminFetch(`/api/jobs/${selectedJob.id}/milestone`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestone }),
        });
        const json = (await res.json().catch(() => null)) as JobDetailResponse | null;
        if (!res.ok || !json?.ok || !json.data?.job) {
          throw new Error(json?.error ?? "Could not log milestone.");
        }
        applyJobDetails(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not log milestone.");
      } finally {
        setMilestoneLoading(null);
      }
    },
    [applyJobDetails, selectedJob]
  );

  const handleStatusApply = useCallback(() => {
    if (!selectedJob || selectedJob.status === statusDraft) return;
    void patchJob({ status: statusDraft });
  }, [patchJob, selectedJob, statusDraft]);

  const handleTimelineNoteAdd = useCallback(() => {
    const body = timelineNote.trim();
    if (!body) return;
    void patchJob({ note: { author: "Technician", body, source: "human" } }).then(() =>
      setTimelineNote("")
    );
  }, [patchJob, timelineNote]);

  const handleCustomerDraft = useCallback(async () => {
    if (!selectedJob) return;
    setDraftingCustomer(true);
    setError(null);
    try {
      const statusLabel =
        JOB_STATUS_LABELS[selectedJob.status as JobStatus] ?? selectedJob.status;
      const noteLines = notes
        .slice(-5)
        .map((n) => `- [${n.source}] ${n.body}`)
        .join("\n");
      const context = [
        `Customer: ${selectedJob.customerName}`,
        `Registration: ${selectedJob.registration}`,
        `Service: ${selectedJob.service}`,
        `Status: ${statusLabel}`,
        `Symptoms: ${selectedJob.symptomsText ?? "Not recorded"}`,
        `Workshop notes: ${selectedJob.notesText ?? "Not recorded"}`,
        noteLines ? `Recent timeline:\n${noteLines}` : "Recent timeline: none",
        "Draft a concise, friendly customer update for SMS/email.",
      ].join("\n");

      const result = await askWorkshopCopilot({
        promptKind: "customer_explanation",
        message: "Draft customer update for this job.",
        context,
        jobId: selectedJob.id,
      });
      setCustomerDraft(result.reply.trim());
      setTab("overview");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not draft customer message right now."
      );
    } finally {
      setDraftingCustomer(false);
    }
  }, [notes, selectedJob]);

  const handleAiSuggest = useCallback(
    async (kind: "diagnostics" | "workshop_notes") => {
      if (!selectedJob) return;
      setAiLoading(true);
      setError(null);
      try {
        const result = await askWorkshopCopilot({
          promptKind: kind,
          message:
            kind === "diagnostics"
              ? "Provide likely causes and bay checks."
              : "Draft concise workshop notes for this job.",
          context: [
            `Registration: ${selectedJob.registration}`,
            `Service: ${selectedJob.service}`,
            `Symptoms: ${selectedJob.symptomsText ?? "Not recorded"}`,
            `Notes: ${selectedJob.notesText ?? "Not recorded"}`,
          ].join("\n"),
          jobId: selectedJob.id,
        });
        setAiDraft(result.reply.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI draft failed.");
      } finally {
        setAiLoading(false);
      }
    },
    [selectedJob]
  );

  const copyText = useCallback(async (value: string, failMessage: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError(failMessage);
    }
  }, []);

  const mailtoHref = useMemo(() => {
    if (!selectedJob) return "mailto:";
    return `mailto:?subject=${encodeURIComponent(
      `Update on your vehicle (${selectedJob.registration})`
    )}&body=${encodeURIComponent(customerDraft || "")}`;
  }, [customerDraft, selectedJob]);

  return (
    <main className="admin-content-wrap max-w-[1700px] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Jobs Cockpit</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Queue clarity, fast status, and assistant context in one view.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#d4a63c] hover:underline">
          ← Hub
        </Link>
      </header>

      <AdminQuickLinks active="jobs" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          ref={searchInputRef}
          value={regSearch}
          onChange={(event) => setRegSearch(event.target.value)}
          placeholder="Filter queue — reg / customer (/) · ⌘K global search"
          className="input-premium min-h-11 w-full rounded-xl px-3 text-sm text-white sm:max-w-md"
        />
        <button
          type="button"
          onClick={() => void loadJobs()}
          className="min-h-11 rounded-xl border border-white/15 px-3 text-xs text-zinc-300 hover:border-white/30"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            setWalkInReg("");
            setWalkInOpen(true);
          }}
          className="min-h-11 rounded-xl border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-3 text-xs font-semibold text-[#e8d5a3] hover:border-[#d4a63c]/55"
        >
          + Walk-in
        </button>
      </div>

      <WalkInJobDialog
        open={walkInOpen}
        initialReg={walkInReg}
        onClose={() => setWalkInOpen(false)}
        onCreated={(job) => {
          setJobs((prev) => [job, ...prev]);
          setSelectedJobId(job.id);
        }}
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cockpit…
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)_28rem]">
          <aside className="order-1 min-w-0 lg:order-none lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:pr-1">
            <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
            {TODAY_COLUMNS.map((col) => (
              <section
                key={col.id}
                className="premium-card w-[min(82vw,16.5rem)] shrink-0 snap-start rounded-2xl p-3 lg:w-auto lg:shrink"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {col.label}
                  </h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
                    {queueColumns[col.id].length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {queueColumns[col.id].length === 0 ? (
                    <li className="text-xs text-zinc-600">—</li>
                  ) : (
                    queueColumns[col.id].map((job) => {
                      const active = selectedJobId === job.id;
                      const cardNext = nextStatus(job.status);
                      return (
                        <li key={job.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className={`min-h-11 w-full rounded-xl border px-3 py-3 text-left transition touch-manipulation ${
                              active
                                ? "border-[#d4a63c]/45 bg-[#d4a63c]/12"
                                : "border-white/[0.08] bg-black/35 hover:border-white/20"
                            }`}
                          >
                            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                              Vehicle
                            </p>
                            <p className="font-mono text-sm font-semibold text-[#e8d5a3]">
                              {job.registration}
                            </p>
                            <p className="truncate text-[11px] text-zinc-500">
                              {job.customerName}
                            </p>
                            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                              Work
                            </p>
                            <p className="truncate text-xs text-zinc-300">{job.service}</p>
                            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                              Status
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <AdminStatusBadge kind="job" status={job.status} />
                              {cardNext ? (
                                <span className="text-[10px] text-zinc-500">
                                  Next: {JOB_STATUS_LABELS[cardNext]}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 border-t border-white/[0.06] pt-2">
                              <JobRevenueSummary job={job} compact />
                            </div>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            ))}
            </div>
          </aside>

          <section className="order-2 min-w-0 space-y-4 lg:order-none">
            {!selectedJob ? (
              <div className="premium-card rounded-2xl p-6">
                <p className="text-sm text-zinc-400">Select a job from the queue.</p>
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-20 -mx-1 px-1 pb-2 lg:static lg:z-auto lg:mx-0 lg:px-0 lg:pb-0">
                  <div className="premium-card rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/80 lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Selected job
                      </p>
                      <h2 className="mt-1 font-mono text-2xl font-semibold text-white">
                        {selectedJob.registration}
                      </h2>
                      <p className="mt-0.5 text-sm text-zinc-400">{selectedJob.service}</p>
                    </div>
                    <Link
                      href={`/admin/jobs/${selectedJob.id}`}
                      className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3 text-xs text-zinc-300 hover:border-white/30"
                    >
                      Full job page
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <button
                      type="button"
                      disabled={saving || !primaryNext}
                      onClick={() => primaryNext && void patchJob({ status: primaryNext })}
                      className="btn-glow min-h-11 touch-manipulation rounded-xl px-4 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {primaryNext
                        ? `Next status: ${JOB_STATUS_LABELS[primaryNext]}`
                        : "No next status"}
                    </button>
                    <div className="flex gap-2">
                      <select
                        value={statusDraft}
                        onChange={(event) =>
                          setStatusDraft(event.target.value as JobStatus)
                        }
                        className="input-premium min-h-11 flex-1 rounded-xl px-3 text-sm text-white"
                        disabled={saving}
                      >
                        {JOB_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {JOB_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleStatusApply}
                        disabled={saving || selectedJob.status === statusDraft}
                        className="min-h-11 shrink-0 touch-manipulation rounded-xl border border-white/15 px-4 text-xs font-semibold text-zinc-200 hover:border-white/30 disabled:opacity-45"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="premium-card rounded-2xl p-4">
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                    {TAB_ITEMS.map((item) => {
                      const active = tab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTab(item.id)}
                          className={`min-h-11 shrink-0 touch-manipulation rounded-full border px-4 text-xs font-medium ${
                            active
                              ? "border-[#d4a63c]/40 bg-[#d4a63c]/12 text-[#e8d5a3]"
                              : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {tab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                            Customer
                          </p>
                          <p className="mt-1 text-sm text-zinc-100">{selectedJob.customerName}</p>
                          <p className="text-xs text-zinc-400">{selectedJob.customerPhone}</p>
                          <p className="mt-2 text-xs text-zinc-600">
                            {compactDate(selectedJob.updatedAt)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                            Symptoms
                          </p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {selectedJob.symptomsText?.trim() || "No symptoms recorded yet."}
                          </p>
                        </div>
                      </div>

                      <WorkshopDisclosureSection
                        title="Revenue and invoice"
                        subtitle="Quote, approved value, final invoice"
                      >
                        <div className="space-y-3">
                          <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
                            <p className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
                              Revenue tracking
                            </p>
                            <JobRevenuePanel
                              job={selectedJob}
                              disabled={saving}
                              onSave={async (patch) => {
                                await patchJob(patch);
                              }}
                            />
                          </div>
                          <div className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
                            <JobInvoiceDraftPanel
                              jobId={selectedJob.id}
                              disabled={saving}
                              compact
                              onSaved={() => void loadSelectedJob(selectedJob.id)}
                            />
                          </div>
                        </div>
                      </WorkshopDisclosureSection>

                      <WorkshopDisclosureSection
                        title="Customer update draft"
                        subtitle="AI-assisted message for call, SMS, or email"
                      >
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-amber-100">
                              Customer draft <span className="text-amber-300/90">Draft only</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => void handleCustomerDraft()}
                              disabled={draftingCustomer}
                              className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-full border border-amber-300/30 px-3 text-xs text-amber-100 hover:border-amber-300/60 disabled:opacity-50"
                            >
                              {draftingCustomer ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              Draft message
                            </button>
                          </div>
                          <textarea
                            value={customerDraft}
                            onChange={(event) => setCustomerDraft(event.target.value)}
                            rows={6}
                            placeholder="Generate draft, edit, then copy or send from your phone/email app."
                            className="input-premium mt-2 w-full rounded-xl px-3 py-2 text-sm text-white"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void copyText(customerDraft, "Could not copy draft.")
                              }
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs text-zinc-200 hover:border-white/30"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </button>
                            <a
                              href={`tel:${selectedJob.customerPhone.replace(/\s+/g, "")}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs text-zinc-200 hover:border-white/30"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </a>
                            <a
                              href={mailtoHref}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs text-zinc-200 hover:border-white/30"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </a>
                          </div>
                        </div>
                      </WorkshopDisclosureSection>
                    </div>
                  )}

                  {tab === "timeline" && (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Quick log
                        </p>
                        <JobMilestoneBar
                          disabled={saving}
                          loadingId={milestoneLoading}
                          onMilestone={(id) => void handleMilestone(id)}
                        />
                      </div>
                      <JobTimelineFeed events={timeline} />
                      <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3 sm:flex-row">
                        <input
                          value={timelineNote}
                          onChange={(event) => setTimelineNote(event.target.value)}
                          placeholder="Free-form note…"
                          className="input-premium min-h-11 flex-1 rounded-xl px-3 text-sm text-white"
                        />
                        <button
                          type="button"
                          onClick={handleTimelineNoteAdd}
                          disabled={saving || !timelineNote.trim()}
                          className="min-h-11 rounded-xl border border-white/15 px-4 text-xs text-zinc-200 hover:border-white/30 disabled:opacity-50"
                        >
                          Add note
                        </button>
                      </div>
                    </div>
                  )}

                  {tab === "photos" && selectedJob && (
                    <JobAttachmentsPanel
                      jobId={selectedJob.id}
                      attachments={attachments}
                      disabled={saving}
                      onUploaded={() => void loadSelectedJob(selectedJob.id)}
                    />
                  )}

                  {tab === "ai" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAiSuggest("diagnostics")}
                          disabled={aiLoading}
                          className="min-h-11 rounded-full border border-white/15 px-4 text-xs text-zinc-200 hover:border-white/30 disabled:opacity-50"
                        >
                          Diagnostic checks
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAiSuggest("workshop_notes")}
                          disabled={aiLoading}
                          className="min-h-11 rounded-full border border-white/15 px-4 text-xs text-zinc-200 hover:border-white/30 disabled:opacity-50"
                        >
                          Draft workshop notes
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void copyText(
                              [
                                `Reg: ${selectedJob.registration}`,
                                `Service: ${selectedJob.service}`,
                                `Symptoms: ${selectedJob.symptomsText ?? "n/a"}`,
                              ].join("\n"),
                              "Could not copy AI context."
                            )
                          }
                          className="min-h-11 rounded-full border border-white/15 px-4 text-xs text-zinc-200 hover:border-white/30"
                        >
                          Copy context
                        </button>
                      </div>
                      <textarea
                        value={aiDraft}
                        onChange={(event) => setAiDraft(event.target.value)}
                        rows={8}
                        placeholder="AI draft appears here. Edit before using."
                        className="input-premium w-full rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {error}
              </p>
            )}
          </section>

          <div className="order-3 min-w-0 lg:order-none">
            <JobContextPanel
              job={selectedJob}
              jobsForAssistant={jobs.map((job) => ({
                id: job.id,
                registration: job.registration,
                service: job.service,
              }))}
              history={history}
              historyLoading={historyLoading}
              historyError={historyError}
              vehicleReport={vehicleReport}
              vehicleLoading={vehicleLoading}
              vehicleError={vehicleError}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminJobsCockpitPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-[1600px] px-3 py-6 sm:px-5">
          <p className="text-sm text-zinc-400">Loading workshop jobs…</p>
        </main>
      }
    >
      <AdminJobsCockpitContent />
    </Suspense>
  );
}
