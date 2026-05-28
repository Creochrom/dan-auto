import type { JobStatus } from "@/lib/types/job";

export const INVOICE_STATUSES = ["draft"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type Vehicle = {
  id: string;
  registration: string;
  registrationCanonical: string;
  make?: string;
  model?: string;
  year?: number;
  colour?: string;
  vin?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertVehicleInput = {
  registration: string;
  make?: string;
  model?: string;
  year?: number;
  colour?: string;
  vin?: string;
};

export const VEHICLE_TIMELINE_EVENT_TYPES = [
  "mot_test",
  "job_status_change",
  "system",
] as const;
export type VehicleTimelineEventType = (typeof VEHICLE_TIMELINE_EVENT_TYPES)[number];

export type VehicleTimelineEvent = {
  id: string;
  vehicleId: string;
  eventType: VehicleTimelineEventType;
  source: string;
  sourceRef?: string;
  title: string;
  description?: string;
  eventAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type CreateVehicleTimelineEventInput = {
  vehicleId: string;
  eventType: VehicleTimelineEventType;
  source?: string;
  sourceRef?: string;
  title: string;
  description?: string;
  eventAt?: string;
  metadata?: Record<string, unknown>;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertCustomerInput = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
};

export const JOB_ATTACHMENT_KINDS = ["photo", "document"] as const;
export type JobAttachmentKind = (typeof JOB_ATTACHMENT_KINDS)[number];

export type JobAttachment = {
  id: string;
  jobId: string;
  uploadId?: string;
  kind: JobAttachmentKind;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  uploadedBy: string;
  createdAt: string;
};

export type CreateJobAttachmentInput = {
  jobId: string;
  uploadId?: string;
  kind: JobAttachmentKind;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  uploadedBy: string;
};

export type Invoice = {
  id: string;
  jobId: string;
  invoiceNumber?: string;
  status: InvoiceStatus;
  currency: string;
  subtotalPence?: number;
  vatPence?: number;
  totalPence?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDraftInvoiceInput = {
  jobId: string;
  invoiceNumber?: string;
  currency?: string;
  subtotalPence?: number;
  vatPence?: number;
  totalPence?: number;
  notes?: string;
};

export type UpdateDraftInvoiceInput = {
  invoiceNumber?: string;
  subtotalPence?: number;
  vatPence?: number;
  totalPence?: number;
  notes?: string;
};

export type AiContextSnapshot = {
  id: string;
  jobId: string;
  source: "workshop_copilot";
  model?: string;
  prompt?: string;
  response?: string;
  contextJson?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type CreateAiContextSnapshotInput = {
  jobId: string;
  source?: "workshop_copilot";
  model?: string;
  prompt?: string;
  response?: string;
  contextJson?: Record<string, unknown>;
  createdBy: string;
};

export type CreateTimelineStatusEventInput = {
  jobId: string;
  actor: string;
  fromStatus?: JobStatus | null;
  toStatus: JobStatus;
  note?: string;
  metadata?: Record<string, unknown>;
};

export type CreateTimelineEventInput = {
  jobId: string;
  eventType:
    | "note"
    | "attachment_added"
    | "invoice_draft_created"
    | "invoice_draft_updated"
    | "ai_snapshot"
    | "system";
  actor: string;
  note?: string;
  metadata?: Record<string, unknown>;
};
