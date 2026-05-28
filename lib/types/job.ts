/**
 * Workshop job card domain model — Workshop OS v1.
 *
 * Lifecycle:
 *   booked → checked_in → diagnosing → awaiting_approval
 *   → (awaiting_parts →) in_progress → quality_check
 *   → ready_for_collection → collected
 *   Any state → cancelled
 *
 * A job is created either from a confirmed booking (bookingId set) or
 * as a walk-in via POST /api/jobs (bookingId absent).
 */

/** Human-readable label for each job status (used in admin UI). */
export const JOB_STATUS_LABELS: Record<string, string> = {
  booked:                "Booked",
  checked_in:            "Checked In",
  diagnosing:            "Diagnosing",
  awaiting_approval:     "Awaiting Approval",
  awaiting_parts:        "Awaiting Parts",
  in_progress:           "In Progress",
  quality_check:         "Quality Check",
  ready_for_collection:  "Ready for Collection",
  collected:             "Collected",
  cancelled:             "Cancelled",
};

export const JOB_STATUSES = [
  "booked",
  "checked_in",
  "diagnosing",
  "awaiting_approval",
  "awaiting_parts",
  "in_progress",
  "quality_check",
  "ready_for_collection",
  "collected",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type JobVehicleRef = {
  id: string;
  registration: string;
  registrationCanonical: string;
};

export type JobCustomerRef = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

export type Job = {
  id: string;
  /** Linked booking, if this job originated from one. */
  bookingId?: string;
  vehicleId?: string;
  customerId?: string;
  vehicle?: JobVehicleRef;
  customer?: JobCustomerRef;
  /** Backward-compatible convenience mirrors of linked entities. */
  registration: string;
  customerName: string;
  customerPhone: string;
  /** ISO date (YYYY-MM-DD) the vehicle is expected or arrived. */
  scheduledDate: string;
  status: JobStatus;
  service: string;
  symptomsText?: string;
  notesText?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
};

/** Append-only technician / AI note on a job. Never edited after creation. */
export type JobNote = {
  id: string;
  jobId: string;
  author: string;
  body: string;
  source: "human" | "ai";
  createdAt: string;
};

/** Immutable audit record written whenever job status changes. */
export type JobStatusEvent = {
  id: string;
  jobId: string;
  fromStatus: JobStatus | null;
  toStatus: JobStatus;
  changedBy: string;
  createdAt: string;
};

export type CreateJobInput = {
  bookingId?: string;
  registration: string;
  /** Defaults to today when absent. */
  scheduledDate?: string;
  /** Defaults to "booked" (scheduled) or caller can set "checked_in" for walk-ins. */
  status?: JobStatus;
  customerName: string;
  customerPhone: string;
  service: string;
  symptomsText?: string;
  assignedTo?: string;
};

export type UpdateJobInput = {
  status?: JobStatus;
  notesText?: string;
  symptomsText?: string;
  assignedTo?: string;
};

export type AddJobNoteInput = {
  jobId: string;
  author: string;
  body: string;
  source?: "human" | "ai";
};

export type JobWithNotes = Job & { notes: JobNote[] };

export const JOB_TIMELINE_EVENT_TYPES = [
  "status_change",
  "note",
  "attachment_added",
  "invoice_draft_created",
  "invoice_draft_updated",
  "ai_snapshot",
  "system",
] as const;

export type JobTimelineEventType = (typeof JOB_TIMELINE_EVENT_TYPES)[number];

export type JobTimelineEvent = {
  id: string;
  jobId: string;
  eventType: JobTimelineEventType;
  actor: string;
  fromStatus?: JobStatus;
  toStatus?: JobStatus;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type JobAttachment = {
  id: string;
  jobId: string;
  uploadId?: string;
  kind: "photo" | "document";
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  uploadedBy: string;
  createdAt: string;
};

export type JobWithDetails = Job & {
  notes: JobNote[];
  timeline: JobTimelineEvent[];
  attachments: JobAttachment[];
};

/** Filters for the job list endpoint. */
export type JobListFilters = {
  status?: JobStatus;
  /** "today" or ISO date YYYY-MM-DD */
  date?: string;
  assignedTo?: string;
  registration?: string;
};
