import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseAttachmentsRepository } from "@/lib/repositories/supabase/attachments.repository";
import type { CreateJobAttachmentInput, JobAttachment } from "@/lib/types/workshop-data";

const mockAttachments = new Map<string, JobAttachment[]>();

function newId() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const attachmentsRepository = {
  async listByJobId(jobId: string): Promise<JobAttachment[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseAttachmentsRepository.listByJobId(jobId);
    }
    return (mockAttachments.get(jobId) ?? []).slice().sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  async create(input: CreateJobAttachmentInput): Promise<JobAttachment> {
    if (getStorageBackend() === "supabase") {
      return supabaseAttachmentsRepository.create(input);
    }
    const attachment: JobAttachment = {
      id: newId(),
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
};
