import { bookingsRepository } from "@/lib/repositories/bookings.repository";
import { invoicesRepository } from "@/lib/repositories/invoices.repository";
import { jobsRepository } from "@/lib/repositories/jobs.repository";
import { leadsRepository } from "@/lib/repositories/leads.repository";
import { isAnythingLlmConfigured } from "@/lib/copilot/config";
import { anythingllmKnowledgeService } from "@/lib/services/anythingllm-knowledge.service";
import { stripPlate } from "@/lib/format-plate";

export type WorkshopSearchResultKind =
  | "job"
  | "booking"
  | "lead"
  | "vehicle"
  | "manual"
  | "invoice"
  | "attachment";

export type WorkshopSearchResult = {
  kind: WorkshopSearchResultKind;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const MAX_PER_KIND = 6;
/** Pragmatic v1: scan recent jobs for attachment file names when query is specific enough. */
const ATTACHMENT_SCAN_JOB_LIMIT = 50;
const ATTACHMENT_QUERY_MIN_LEN = 3;

function matches(query: string, ...parts: Array<string | undefined>) {
  const hay = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

export async function workshopSearch(rawQuery: string): Promise<WorkshopSearchResult[]> {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  const canon = stripPlate(query);

  const [jobs, bookings, leads, invoices] = await Promise.all([
    jobsRepository.list({}),
    bookingsRepository.list(),
    leadsRepository.list(),
    invoicesRepository.listRecent(200),
  ]);

  const jobById = new Map(jobs.map((job) => [job.id, job]));
  const results: WorkshopSearchResult[] = [];

  for (const job of jobs) {
    if (
      !matches(
        query,
        job.registration,
        job.customerName,
        job.customerPhone,
        job.service,
        job.id,
        canon
      )
    ) {
      continue;
    }
    results.push({
      kind: "job",
      id: job.id,
      title: job.registration,
      subtitle: `${job.service} · ${job.customerName}`,
      href: `/admin/jobs?job=${job.id}`,
    });
    if (results.filter((r) => r.kind === "job").length >= MAX_PER_KIND) break;
  }

  for (const booking of bookings) {
    if (
      !matches(
        query,
        booking.registration,
        booking.customerName,
        booking.customerPhone,
        booking.service,
        booking.id,
        canon
      )
    ) {
      continue;
    }
    results.push({
      kind: "booking",
      id: booking.id,
      title: booking.registration,
      subtitle: `${booking.service} · ${booking.status.replaceAll("_", " ")}`,
      href: `/admin/bookings/${booking.id}`,
    });
    if (results.filter((r) => r.kind === "booking").length >= MAX_PER_KIND) break;
  }

  for (const lead of leads) {
    if (!matches(query, lead.name, lead.phone, lead.email, lead.id)) continue;
    results.push({
      kind: "lead",
      id: lead.id,
      title: lead.name,
      subtitle: lead.phone,
      href: `/admin/leads`,
    });
    if (results.filter((r) => r.kind === "lead").length >= MAX_PER_KIND) break;
  }

  const vehicleSeen = new Set<string>();
  for (const job of jobs) {
    const reg = job.registration.trim().toUpperCase();
    if (vehicleSeen.has(reg)) continue;
    if (!matches(query, reg, canon)) continue;
    vehicleSeen.add(reg);
    results.push({
      kind: "vehicle",
      id: reg,
      title: reg,
      subtitle: "Vehicle memory",
      href: `/admin/vehicle/${encodeURIComponent(reg)}`,
    });
    if (results.filter((r) => r.kind === "vehicle").length >= MAX_PER_KIND) break;
  }

  for (const invoice of invoices) {
    const job = jobById.get(invoice.jobId);
    const reg = job?.registration ?? "";
    if (
      !matches(
        query,
        invoice.id,
        invoice.invoiceNumber,
        invoice.jobId,
        reg,
        canon
      )
    ) {
      continue;
    }
    results.push({
      kind: "invoice",
      id: invoice.id,
      title: invoice.invoiceNumber?.trim() || `Draft · ${reg || invoice.jobId}`,
      subtitle: reg
        ? `${reg} · ${invoice.status}`
        : `Job ${invoice.jobId.slice(0, 8)}…`,
      href: job ? `/admin/jobs?job=${job.id}` : `/admin/jobs`,
    });
    if (results.filter((r) => r.kind === "invoice").length >= MAX_PER_KIND) break;
  }

  if (query.length >= ATTACHMENT_QUERY_MIN_LEN) {
    const scanJobs = jobs.slice(0, ATTACHMENT_SCAN_JOB_LIMIT);
    const detailsList = await Promise.all(
      scanJobs.map((job) => jobsRepository.findByIdWithDetails(job.id))
    );
    for (let i = 0; i < scanJobs.length; i++) {
      const job = scanJobs[i];
      const details = detailsList[i];
      if (!details?.attachments.length) continue;
      for (const att of details.attachments) {
        if (!matches(query, att.fileName)) continue;
        results.push({
          kind: "attachment",
          id: att.id,
          title: att.fileName,
          subtitle: job.registration,
          href: `/admin/jobs?job=${job.id}`,
        });
        if (results.filter((r) => r.kind === "attachment").length >= MAX_PER_KIND) break;
      }
      if (results.filter((r) => r.kind === "attachment").length >= MAX_PER_KIND) break;
    }
  }

  if (isAnythingLlmConfigured()) {
    try {
      const documents = await anythingllmKnowledgeService.listDocuments();
      for (const doc of documents) {
        const name = doc.name?.trim() || "";
        if (!name || !matches(query, name)) continue;
        results.push({
          kind: "manual",
          id: name,
          title: name,
          subtitle: "Service manual",
          href: `/admin/knowledge`,
        });
        if (results.filter((r) => r.kind === "manual").length >= MAX_PER_KIND) break;
      }
    } catch {
      // RAG optional — search still returns operational rows.
    }
  }

  return results;
}
