/**
 * Facade repository for workshop jobs.
 * Delegates to Supabase when STORAGE_BACKEND=supabase,
 * otherwise uses a module-level in-memory mock (dev / STORAGE_BACKEND=mock).
 */

import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseJobsRepository } from "@/lib/repositories/supabase/jobs.repository";
import { stripPlate } from "@/lib/format-plate";
import type {
  Job,
  JobAttachment,
  JobNote,
  JobStatus,
  JobTimelineEvent,
  JobTimelineEventType,
  JobWithDetails,
  JobWithNotes,
  CreateJobInput,
  UpdateJobInput,
  AddJobNoteInput,
  JobListFilters,
} from "@/lib/types/job";

// ─── In-memory mock ──────────────────────────────────────────────────────────

const mockJobs = new Map<string, Job>();
const mockNotes = new Map<string, JobNote[]>(); // keyed by jobId
const mockTimeline = new Map<string, JobTimelineEvent[]>(); // keyed by jobId
const mockAttachments = new Map<string, JobAttachment[]>(); // keyed by jobId

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function vehicleRef(registration: string) {
  const canonical = stripPlate(registration);
  return {
    id: `veh_${canonical}`,
    registration: registration.trim().toUpperCase(),
    registrationCanonical: canonical,
  };
}

function customerRef(name: string, phone: string) {
  const idRaw = `${phone.trim().toLowerCase()}|${name.trim().toLowerCase()}`
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9|]/g, "")
    .slice(0, 42);
  const id = `cus_${Buffer.from(idRaw).toString("base64url").slice(0, 22)}`;
  return {
    id,
    name: name.trim(),
    phone: phone.trim(),
  };
}

// ─── Facade ──────────────────────────────────────────────────────────────────

export const jobsRepository = {
  async list(filters: JobListFilters): Promise<Job[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.list(filters);
    }

    const date =
      filters.date === "today" ? todayIso() : filters.date ?? null;
    const assignedTo = filters.assignedTo?.trim();
    const registration = filters.registration?.trim().toUpperCase();

    return [...mockJobs.values()]
      .filter((j) => {
        if (filters.status && j.status !== filters.status) return false;
        if (date && j.scheduledDate !== date) return false;
        if (assignedTo && (j.assignedTo ?? "") !== assignedTo) return false;
        if (registration && !j.registration.includes(registration)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listByRegistration(registration: string): Promise<Job[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.listByRegistration(registration);
    }
    const canon = registration.toUpperCase();
    return [...mockJobs.values()]
      .filter((j) => j.registration === canon)
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  },

  async findById(id: string): Promise<Job | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.findById(id);
    }
    return mockJobs.get(id);
  },

  async findByIdWithNotes(id: string): Promise<JobWithNotes | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.findByIdWithNotes(id);
    }
    const job = mockJobs.get(id);
    if (!job) return undefined;
    const notes = (mockNotes.get(id) ?? []).slice().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    return { ...job, notes };
  },

  async findByIdWithDetails(id: string): Promise<JobWithDetails | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.findByIdWithDetails(id);
    }
    const job = mockJobs.get(id);
    if (!job) return undefined;
    const notes = (mockNotes.get(id) ?? []).slice().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    const timeline = (mockTimeline.get(id) ?? []).slice().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    const attachments = (mockAttachments.get(id) ?? []).slice().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    return { ...job, notes, timeline, attachments };
  },

  async create(input: CreateJobInput): Promise<Job> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.create(input);
    }

    const now = new Date().toISOString();
    const vehicle = vehicleRef(input.registration);
    const customer = customerRef(input.customerName, input.customerPhone);
    const job: Job = {
      id: newId("job"),
      bookingId: input.bookingId,
      vehicleId: vehicle.id,
      customerId: customer.id,
      vehicle,
      customer,
      registration: vehicle.registration,
      scheduledDate: input.scheduledDate ?? todayIso(),
      status: input.status ?? "booked",
      customerName: customer.name,
      customerPhone: customer.phone,
      service: input.service,
      symptomsText: input.symptomsText,
      assignedTo: input.assignedTo,
      estimatedValuePence: input.estimatedValuePence ?? null,
      approvedQuotePence: null,
      finalInvoicePence: null,
      createdAt: now,
      updatedAt: now,
    };

    mockJobs.set(job.id, job);
    return job;
  },

  async update(id: string, patch: UpdateJobInput): Promise<Job | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.update(id, patch);
    }

    const job = mockJobs.get(id);
    if (!job) return null;

    const updated: Job = {
      ...job,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.notesText !== undefined ? { notesText: patch.notesText } : {}),
      ...(patch.symptomsText !== undefined ? { symptomsText: patch.symptomsText } : {}),
      ...(patch.assignedTo !== undefined ? { assignedTo: patch.assignedTo } : {}),
      ...(patch.estimatedValuePence !== undefined
        ? { estimatedValuePence: patch.estimatedValuePence }
        : {}),
      ...(patch.approvedQuotePence !== undefined
        ? { approvedQuotePence: patch.approvedQuotePence }
        : {}),
      ...(patch.finalInvoicePence !== undefined
        ? { finalInvoicePence: patch.finalInvoicePence }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    mockJobs.set(id, updated);
    return updated;
  },

  async addNote(input: AddJobNoteInput): Promise<JobNote> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.addNote(input);
    }

    const note: JobNote = {
      id: newId("jnote"),
      jobId: input.jobId,
      author: input.author,
      body: input.body,
      source: input.source ?? "human",
      createdAt: new Date().toISOString(),
    };

    const existing = mockNotes.get(input.jobId) ?? [];
    mockNotes.set(input.jobId, [...existing, note]);
    return note;
  },

  async addAttachment(input: {
    jobId: string;
    uploadId?: string;
    kind: "photo" | "document";
    fileName: string;
    mimeType?: string;
    sizeBytes?: number;
    storagePath?: string;
    uploadedBy: string;
  }): Promise<JobAttachment> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.addAttachment(input);
    }
    const attachment: JobAttachment = {
      id: newId("jatt"),
      jobId: input.jobId,
      uploadId: input.uploadId,
      kind: input.kind,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
      uploadedBy: input.uploadedBy,
      createdAt: new Date().toISOString(),
    };
    const existing = mockAttachments.get(input.jobId) ?? [];
    mockAttachments.set(input.jobId, [...existing, attachment]);
    return attachment;
  },

  async recordStatusEvent(
    jobId: string,
    fromStatus: JobStatus | null,
    toStatus: JobStatus,
    changedBy: string
  ): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.recordStatusEvent(
        jobId,
        fromStatus,
        toStatus,
        changedBy
      );
    }
    const existing = mockTimeline.get(jobId) ?? [];
    const timelineEvent: JobTimelineEvent = {
      id: newId("jte"),
      jobId,
      eventType: "status_change",
      actor: changedBy,
      fromStatus: fromStatus ?? undefined,
      toStatus,
      createdAt: new Date().toISOString(),
    };
    mockTimeline.set(jobId, [...existing, timelineEvent]);
  },

  async addTimelineEvent(input: {
    jobId: string;
    eventType: JobTimelineEventType;
    actor: string;
    fromStatus?: JobStatus | null;
    toStatus?: JobStatus | null;
    note?: string;
    metadata?: Record<string, unknown>;
  }): Promise<JobTimelineEvent> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.addTimelineEvent(input);
    }
    const event: JobTimelineEvent = {
      id: newId("jte"),
      jobId: input.jobId,
      eventType: input.eventType,
      actor: input.actor,
      fromStatus: input.fromStatus ?? undefined,
      toStatus: input.toStatus ?? undefined,
      note: input.note,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };
    const existing = mockTimeline.get(input.jobId) ?? [];
    mockTimeline.set(input.jobId, [...existing, event]);
    return event;
  },

  async findByBookingId(bookingId: string): Promise<Job | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseJobsRepository.findByBookingId(bookingId);
    }
    return [...mockJobs.values()].find((job) => job.bookingId === bookingId);
  },
};
