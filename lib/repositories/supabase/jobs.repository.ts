/**
 * Supabase implementation of the jobs repository.
 * Only active when STORAGE_BACKEND=supabase.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { stripPlate } from "@/lib/format-plate";
import type {
  Job,
  JobAttachment,
  JobNote,
  JobStatus,
  JobStatusEvent,
  JobTimelineEvent,
  JobTimelineEventType,
  JobWithDetails,
  JobWithNotes,
  CreateJobInput,
  UpdateJobInput,
  AddJobNoteInput,
  JobListFilters,
} from "@/lib/types/job";

// ─── Row shapes (snake_case from PostgREST) ──────────────────────────────────

type VehicleRow = {
  id: string;
  registration: string;
  registration_canonical: string;
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type JobRow = {
  id: string;
  booking_id: string | null;
  vehicle_id: string;
  customer_id: string;
  registration: string;
  scheduled_date: string;
  status: JobStatus;
  customer_name: string;
  customer_phone: string;
  service: string;
  symptoms_text: string | null;
  notes_text: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  vehicles?: VehicleRow | null;
  customers?: CustomerRow | null;
};

type JobNoteRow = {
  id: string;
  job_id: string;
  author: string;
  body: string;
  source: "human" | "ai";
  created_at: string;
};

type JobStatusEventRow = {
  id: string;
  job_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  created_at: string;
};

type JobTimelineEventRow = {
  id: string;
  job_id: string;
  event_type: JobTimelineEventType;
  actor: string;
  from_status: JobStatus | null;
  to_status: JobStatus | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type JobAttachmentRow = {
  id: string;
  job_id: string;
  upload_id: string | null;
  kind: "photo" | "document";
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  uploaded_by: string;
  created_at: string;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

function toJob(row: JobRow): Job {
  const vehicle = row.vehicles as VehicleRow;
  const customer = row.customers as CustomerRow;
  const registration = vehicle?.registration ?? row.registration;
  const canonical = vehicle?.registration_canonical ?? stripPlate(registration);
  const customerName = customer?.name ?? row.customer_name;
  const customerPhone = customer?.phone ?? row.customer_phone;
  return {
    id: row.id,
    bookingId: row.booking_id ?? undefined,
    vehicleId: row.vehicle_id,
    customerId: row.customer_id,
    vehicle: {
      id: row.vehicle_id,
      registration,
      registrationCanonical: canonical,
    },
    customer: {
      id: row.customer_id,
      name: customerName,
      phone: customerPhone,
      email: customer?.email ?? undefined,
    },
    registration,
    scheduledDate: row.scheduled_date,
    status: row.status,
    customerName,
    customerPhone,
    service: row.service,
    symptomsText: row.symptoms_text ?? undefined,
    notesText: row.notes_text ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toJobNote(row: JobNoteRow): JobNote {
  return {
    id: row.id,
    jobId: row.job_id,
    author: row.author,
    body: row.body,
    source: row.source,
    createdAt: row.created_at,
  };
}

function toTimelineEvent(row: JobTimelineEventRow): JobTimelineEvent {
  return {
    id: row.id,
    jobId: row.job_id,
    eventType: row.event_type,
    actor: row.actor,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status ?? undefined,
    note: row.note ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

function toAttachment(row: JobAttachmentRow): JobAttachment {
  return {
    id: row.id,
    jobId: row.job_id,
    uploadId: row.upload_id ?? undefined,
    kind: row.kind,
    fileName: row.file_name,
    mimeType: row.mime_type ?? undefined,
    sizeBytes: row.size_bytes ?? undefined,
    storagePath: row.storage_path ?? undefined,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function newVehicleId(registration: string) {
  return `veh_${stripPlate(registration).toLowerCase()}`;
}

function newCustomerId(name: string, phone: string) {
  const raw = `${phone.trim().toLowerCase()}|${name.trim().toLowerCase()}`
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9|]/g, "")
    .slice(0, 42);
  const hash = Buffer.from(raw).toString("base64url").slice(0, 22);
  return `cus_${hash}`;
}

async function ensureVehicle(registration: string): Promise<VehicleRow> {
  const supabase = getSupabaseServerClient();
  const canonical = stripPlate(registration);
  const display = registration.trim().toUpperCase();
  const row: VehicleRow = {
    id: newVehicleId(canonical),
    registration: display,
    registration_canonical: canonical,
  };
  const { data, error } = await supabase
    .from("vehicles")
    .upsert(row, { onConflict: "registration_canonical" })
    .select("*")
    .single();
  if (error) throw new Error(`[jobs] ensureVehicle failed: ${error.message}`);
  return data as VehicleRow;
}

async function ensureCustomer(name: string, phone: string): Promise<CustomerRow> {
  const supabase = getSupabaseServerClient();
  const row: CustomerRow = {
    id: newCustomerId(name, phone),
    name: name.trim(),
    phone: phone.trim(),
    email: null,
  };
  const { data, error } = await supabase
    .from("customers")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(`[jobs] ensureCustomer failed: ${error.message}`);
  return data as CustomerRow;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export const supabaseJobsRepository = {
  async list(filters: JobListFilters): Promise<Job[]> {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("jobs")
      .select("*, vehicles(*), customers(*)")
      .order("scheduled_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const date =
      filters.date === "today" ? todayIso() : filters.date ?? null;
    if (date) {
      query = query.eq("scheduled_date", date);
    }

    if (filters.assignedTo) {
      query = query.eq("assigned_to", filters.assignedTo);
    }

    if (filters.registration) {
      query = query.ilike("registration", `%${filters.registration.toUpperCase()}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[jobs] list failed: ${error.message}`);
    return (data as JobRow[]).map(toJob);
  },

  async listByRegistration(registration: string): Promise<Job[]> {
    const supabase = getSupabaseServerClient();
    const canonical = stripPlate(registration);
    const { data, error } = await supabase
      .from("jobs")
      .select("*, vehicles!inner(*), customers(*)")
      .eq("vehicles.registration_canonical", canonical)
      .order("scheduled_date", { ascending: false });

    if (error) throw new Error(`[jobs] listByRegistration failed: ${error.message}`);
    return (data as JobRow[]).map(toJob);
  },

  async findById(id: string): Promise<Job | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, vehicles(*), customers(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`[jobs] findById failed: ${error.message}`);
    if (!data) return undefined;
    return toJob(data as JobRow);
  },

  async findByIdWithNotes(id: string): Promise<JobWithNotes | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, job_notes(*), vehicles(*), customers(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`[jobs] findByIdWithNotes failed: ${error.message}`);
    if (!data) return undefined;

    const row = data as JobRow & { job_notes: JobNoteRow[] };
    const notes = (row.job_notes ?? [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(toJobNote);

    return { ...toJob(row), notes };
  },

  async findByIdWithDetails(id: string): Promise<JobWithDetails | undefined> {
    const supabase = getSupabaseServerClient();

    const [jobRes, notesRes, timelineRes, attachmentsRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("*, vehicles(*), customers(*)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("job_notes")
        .select("*")
        .eq("job_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("job_timeline_events")
        .select("*")
        .eq("job_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("attachments")
        .select("*")
        .eq("job_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (jobRes.error) throw new Error(`[jobs] findByIdWithDetails failed: ${jobRes.error.message}`);
    if (!jobRes.data) return undefined;
    if (notesRes.error) throw new Error(`[jobs] findByIdWithDetails notes failed: ${notesRes.error.message}`);
    if (timelineRes.error) throw new Error(`[jobs] findByIdWithDetails timeline failed: ${timelineRes.error.message}`);
    if (attachmentsRes.error) throw new Error(`[jobs] findByIdWithDetails attachments failed: ${attachmentsRes.error.message}`);

    return {
      ...toJob(jobRes.data as JobRow),
      notes: (notesRes.data as JobNoteRow[]).map(toJobNote),
      timeline: (timelineRes.data as JobTimelineEventRow[]).map(toTimelineEvent),
      attachments: (attachmentsRes.data as JobAttachmentRow[]).map(toAttachment),
    };
  },

  async create(input: CreateJobInput): Promise<Job> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const [vehicle, customer] = await Promise.all([
      ensureVehicle(input.registration),
      ensureCustomer(input.customerName, input.customerPhone),
    ]);

    const row: JobRow = {
      id: newId("job"),
      booking_id: input.bookingId ?? null,
      vehicle_id: vehicle.id,
      customer_id: customer.id,
      registration: vehicle.registration,
      scheduled_date: input.scheduledDate ?? todayIso(),
      status: input.status ?? "booked",
      customer_name: customer.name,
      customer_phone: customer.phone,
      service: input.service,
      symptoms_text: input.symptomsText ?? null,
      notes_text: null,
      assigned_to: input.assignedTo ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("jobs")
      .insert(row)
      .select("*, vehicles(*), customers(*)")
      .single();

    if (error) throw new Error(`[jobs] create failed: ${error.message}`);
    return toJob(data as JobRow);
  },

  async update(id: string, patch: UpdateJobInput): Promise<Job | null> {
    const supabase = getSupabaseServerClient();

    const updates: Partial<JobRow> = {};
    if (patch.status !== undefined) updates.status = patch.status;
    if (patch.notesText !== undefined) updates.notes_text = patch.notesText;
    if (patch.symptomsText !== undefined) updates.symptoms_text = patch.symptomsText;
    if (patch.assignedTo !== undefined) updates.assigned_to = patch.assignedTo;

    if (Object.keys(updates).length === 0) {
      return (await this.findById(id)) ?? null;
    }

    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .select("*, vehicles(*), customers(*)")
      .maybeSingle();

    if (error) throw new Error(`[jobs] update failed: ${error.message}`);
    if (!data) return null;
    return toJob(data as JobRow);
  },

  async addNote(input: AddJobNoteInput): Promise<JobNote> {
    const supabase = getSupabaseServerClient();

    const row: JobNoteRow = {
      id: newId("jnote"),
      job_id: input.jobId,
      author: input.author,
      body: input.body,
      source: input.source ?? "human",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("job_notes")
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`[jobs] addNote failed: ${error.message}`);
    return toJobNote(data as JobNoteRow);
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
    const supabase = getSupabaseServerClient();

    const row: JobAttachmentRow = {
      id: newId("jatt"),
      job_id: input.jobId,
      upload_id: input.uploadId ?? null,
      kind: input.kind,
      file_name: input.fileName,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      storage_path: input.storagePath ?? null,
      uploaded_by: input.uploadedBy,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("attachments")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(`[jobs] addAttachment failed: ${error.message}`);
    return toAttachment(data as JobAttachmentRow);
  },

  async recordStatusEvent(
    jobId: string,
    fromStatus: JobStatus | null,
    toStatus: JobStatus,
    changedBy: string
  ): Promise<void> {
    const supabase = getSupabaseServerClient();

    const row: JobStatusEventRow = {
      id: newId("jevt"),
      job_id: jobId,
      from_status: fromStatus ?? null,
      to_status: toStatus,
      changed_by: changedBy,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("job_status_events").insert(row);
    if (error) throw new Error(`[jobs] recordStatusEvent failed: ${error.message}`);
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
    const supabase = getSupabaseServerClient();
    const row: JobTimelineEventRow = {
      id: newId("jte"),
      job_id: input.jobId,
      event_type: input.eventType,
      actor: input.actor,
      from_status: input.fromStatus ?? null,
      to_status: input.toStatus ?? null,
      note: input.note ?? null,
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("job_timeline_events")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(`[jobs] addTimelineEvent failed: ${error.message}`);
    return toTimelineEvent(data as JobTimelineEventRow);
  },

  async findByBookingId(bookingId: string): Promise<Job | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, vehicles(*), customers(*)")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (error) throw new Error(`[jobs] findByBookingId failed: ${error.message}`);
    if (!data) return undefined;
    return toJob(data as JobRow);
  },
};
