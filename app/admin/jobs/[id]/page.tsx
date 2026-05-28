"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Loader2, Mail, Phone, Sparkles } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { askWorkshopCopilot } from "@/features/copilot/services/copilot-client";
import { JobAttachmentsPanel } from "@/components/workshop/JobAttachmentsPanel";
import { JobInvoiceDraftPanel } from "@/components/workshop/JobInvoiceDraftPanel";
import { JobMilestoneBar } from "@/components/workshop/JobMilestoneBar";
import { JobTimelineFeed } from "@/components/workshop/JobTimelineFeed";
import { VehicleIntelligencePanel } from "@/components/vehicle/VehicleIntelligencePanel";
import { useVehicleReport } from "@/hooks/useVehicleReport";
import { setActiveJobContext } from "@/lib/workshop/active-job-context";
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

function compactDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminJobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params?.id;

  const [job, setJob] = useState<Job | null>(null);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [timeline, setTimeline] = useState<JobTimelineEvent[]>([]);
  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [milestoneLoading, setMilestoneLoading] = useState<WorkshopMilestoneId | null>(null);
  const [workshopNotes, setWorkshopNotes] = useState("");
  const [timelineNote, setTimelineNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const { report: vehicleReport, loading: vehicleLoading, error: vehicleError } =
    useVehicleReport(job?.registration);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/jobs/${jobId}`, { credentials: "include" });
      if (res.status === 401) {
        router.replace(`/admin/login?from=/admin/jobs/${jobId}`);
        return;
      }

      const json = (await res.json().catch(() => null)) as JobDetailResponse | null;
      if (!res.ok || !json?.ok || !json?.data?.job) {
        throw new Error(json?.error ?? "Unable to load job details.");
      }

      setJob(json.data.job);
      setWorkshopNotes(json.data.job.notesText ?? "");
      setNotes(Array.isArray(json.data.notes) ? json.data.notes : []);
      setTimeline(Array.isArray(json.data.timeline) ? json.data.timeline : []);
      setAttachments(
        Array.isArray(json.data.attachments) ? json.data.attachments : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load job details.");
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!job) return;
    setActiveJobContext({
      id: job.id,
      registration: job.registration,
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      service: job.service,
      status: job.status,
    });
  }, [job]);

  const patchJob = useCallback(
    async (body: Record<string, unknown>) => {
      if (!jobId) return;
      setSaving(true);
      setError(null);
      try {
        const res = await adminFetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => null)) as JobPatchResponse | null;
        if (!res.ok || !json?.ok || !json?.data?.job) {
          throw new Error(json?.error ?? "Could not update job.");
        }
        setJob(json.data.job);
        setWorkshopNotes(json.data.job.notesText ?? "");
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
    [jobId]
  );

  const handleMilestone = useCallback(
    async (milestone: WorkshopMilestoneId) => {
      if (!jobId) return;
      setMilestoneLoading(milestone);
      setError(null);
      try {
        const res = await adminFetch(`/api/jobs/${jobId}/milestone`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestone }),
        });
        const json = (await res.json().catch(() => null)) as JobDetailResponse | null;
        if (!res.ok || !json?.ok || !json.data?.job) {
          throw new Error(json?.error ?? "Could not log milestone.");
        }
        setJob(json.data.job);
        if (json.data.timeline) setTimeline(json.data.timeline);
        if (json.data.notes) setNotes(json.data.notes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not log milestone.");
      } finally {
        setMilestoneLoading(null);
      }
    },
    [jobId]
  );

  const handleStatusChange = useCallback(
    (status: JobStatus) => {
      if (!job || job.status === status) return;
      void patchJob({ status });
    },
    [job, patchJob]
  );

  const handleSaveWorkshopNotes = useCallback(() => {
    void patchJob({ notesText: workshopNotes });
  }, [patchJob, workshopNotes]);

  const handleAddTimelineNote = useCallback(() => {
    const body = timelineNote.trim();
    if (!body) return;
    void patchJob({
      note: { author: "Technician", body, source: "human" },
    }).then(() => setTimelineNote(""));
  }, [patchJob, timelineNote]);

  const draftContext = useMemo(() => {
    if (!job) return "";
    const statusLabel = JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status;
    const noteLines = notes
      .slice(0, 5)
      .map((n) => `- [${n.source}] ${n.body}`)
      .join("\n");

    return [
      `Customer: ${job.customerName}`,
      `Registration: ${job.registration}`,
      `Service: ${job.service}`,
      `Status: ${statusLabel}`,
      `Symptoms: ${job.symptomsText ?? "Not recorded"}`,
      `Workshop notes: ${job.notesText ?? "Not recorded"}`,
      noteLines ? `Recent timeline:\n${noteLines}` : "Recent timeline: none",
      "Write a concise, polite update suitable for SMS/email.",
    ].join("\n");
  }, [job, notes]);

  const handleDraftCustomerUpdate = useCallback(async () => {
    if (!job) return;
    setDrafting(true);
    setError(null);
    try {
      const result = await askWorkshopCopilot({
        promptKind: "customer_explanation",
        message:
          "Draft a customer update based on this job. Keep it clear, practical, and friendly.",
        context: draftContext,
        jobId: job.id,
      });
      setDraftMessage(result.reply.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not draft customer update right now."
      );
    } finally {
      setDrafting(false);
    }
  }, [job, draftContext]);

  const handleCopyDraft = useCallback(async () => {
    if (!draftMessage) return;
    try {
      await navigator.clipboard.writeText(draftMessage);
    } catch {
      setError("Could not copy draft to clipboard.");
    }
  }, [draftMessage]);

  const mailtoHref = useMemo(() => {
    if (!job) return "mailto:";
    const subject = `Update on your vehicle (${job.registration})`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      draftMessage || ""
    )}`;
  }, [job, draftMessage]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-sm text-zinc-500">Loading job details…</p>
      </main>
    );
  }

  if (error && !job) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="premium-card rounded-2xl p-6">
          <p className="text-sm text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => void loadJob()}
            className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 hover:border-white/30 hover:text-white"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="premium-card rounded-2xl p-6">
          <p className="text-sm text-zinc-300">Job not found.</p>
          <Link href="/admin/today" className="mt-4 inline-block text-sm text-[#d4a63c] hover:underline">
            ← Today queue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Job detail</p>
          <h1 className="mt-2 font-mono text-2xl font-semibold text-white">
            {job.registration}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{job.service}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/admin/vehicle/${encodeURIComponent(job.registration)}`}
            className="text-zinc-400 hover:text-white"
          >
            History
          </Link>
          <Link
            href={`/admin/workshop-assistant?jobId=${encodeURIComponent(job.id)}&reg=${encodeURIComponent(
              job.registration
            )}`}
            className="text-cyan hover:underline"
          >
            Workshop Assistant
          </Link>
          <Link
            href={`/admin/jobs?job=${encodeURIComponent(job.id)}`}
            className="text-zinc-400 hover:text-white"
          >
            Cockpit
          </Link>
          <Link href="/admin/today" className="text-[#d4a63c] hover:underline">
            ← Today
          </Link>
        </div>
      </div>

      <section className="premium-card mb-4 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Status — one tap
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {JOB_STATUSES.map((status) => {
            const active = job.status === status;
            return (
              <button
                key={status}
                type="button"
                disabled={saving}
                onClick={() => handleStatusChange(status)}
                className={`min-h-11 rounded-full px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-[#d4a63c]/20 text-[#e8d5a3] ring-1 ring-[#d4a63c]/50"
                    : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                }`}
              >
                {JOB_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="premium-card rounded-2xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Customer message (draft)</p>
            <button
              type="button"
              onClick={() => void handleDraftCustomerUpdate()}
              disabled={drafting}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-4 py-2 text-xs font-semibold text-[#e8d5a3] hover:border-[#d4a63c]/60 disabled:opacity-50"
            >
              {drafting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Draft update
            </button>
          </div>
          <p className="mt-1 text-xs text-amber-200/80">
            You copy and send — nothing goes to the customer automatically.
          </p>

          <textarea
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            rows={8}
            placeholder="Generate a draft, edit, then copy to WhatsApp or SMS."
            className="input-premium mt-3 w-full resize-y rounded-xl px-4 py-3 text-sm text-white"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyDraft()}
              disabled={!draftMessage.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-200 hover:border-white/30 disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy for WhatsApp
            </button>
            <a
              href={mailtoHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-200 hover:border-white/30"
            >
              <Mail className="h-3.5 w-3.5" />
              Email draft
            </a>
            <a
              href={`tel:${job.customerPhone.replace(/\s+/g, "")}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-200 hover:border-white/30"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {error}
            </p>
          )}
        </section>

        <aside className="space-y-4">
          {vehicleLoading ? (
            <div className="premium-card rounded-2xl p-5">
              <p className="text-xs text-zinc-500">Loading vehicle intelligence...</p>
            </div>
          ) : vehicleReport ? (
            <VehicleIntelligencePanel
              report={vehicleReport}
              registration={job.registration}
              assistantHref={`/admin/workshop-assistant?jobId=${encodeURIComponent(job.id)}&reg=${encodeURIComponent(job.registration)}`}
            />
          ) : vehicleError ? (
            <div className="premium-card rounded-2xl p-5">
              <p className="text-xs text-zinc-500">Vehicle intelligence unavailable</p>
              <p className="mt-2 text-xs text-amber-200/90">{vehicleError}</p>
            </div>
          ) : null}

          <div className="premium-card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Customer</p>
            <p className="mt-3 text-sm text-white">{job.customerName}</p>
            <p className="text-xs text-zinc-400">{job.customerPhone}</p>
            <p className="mt-3 text-xs text-zinc-500">
              {JOB_STATUS_LABELS[job.status as JobStatus]}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{compactDate(job.createdAt)}</p>
            {job.symptomsText && (
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">{job.symptomsText}</p>
            )}
          </div>

          <div className="premium-card rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Workshop notes
            </p>
            <textarea
              value={workshopNotes}
              onChange={(e) => setWorkshopNotes(e.target.value)}
              rows={4}
              className="input-premium mt-2 w-full resize-y rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveWorkshopNotes}
              className="mt-2 min-h-10 rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30"
            >
              Save notes
            </button>
          </div>
        </aside>
      </div>

      <section className="premium-card mt-4 rounded-2xl p-5">
        <p className="text-sm font-semibold text-white">Timeline</p>
        <div className="mt-3">
          <JobMilestoneBar
            disabled={saving}
            loadingId={milestoneLoading}
            onMilestone={(id) => void handleMilestone(id)}
          />
        </div>
        <div className="mt-4">
          <JobTimelineFeed events={timeline} />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={timelineNote}
            onChange={(e) => setTimelineNote(e.target.value)}
            placeholder="Add a bay note…"
            className="input-premium min-h-11 flex-1 rounded-xl px-3 text-sm text-white"
          />
          <button
            type="button"
            disabled={saving || !timelineNote.trim()}
            onClick={handleAddTimelineNote}
            className="min-h-11 shrink-0 rounded-full border border-white/15 px-4 text-xs font-medium text-zinc-200 hover:border-white/30 disabled:opacity-50"
          >
            Add note
          </button>
        </div>
      </section>

      <section className="premium-card mt-4 rounded-2xl p-5">
        <JobInvoiceDraftPanel
          jobId={job.id}
          disabled={saving}
          onSaved={() => void loadJob()}
        />
      </section>

      <section className="premium-card mt-4 rounded-2xl p-5">
        <p className="text-sm font-semibold text-white">Attachments</p>
        <p className="mt-1 text-xs text-zinc-500">
          Photos, damage, invoices (PDF). Shown in timeline when uploaded.
        </p>
        <div className="mt-3">
          <JobAttachmentsPanel
            jobId={job.id}
            attachments={attachments}
            disabled={saving}
            onUploaded={() => void loadJob()}
          />
        </div>
      </section>
    </main>
  );
}
