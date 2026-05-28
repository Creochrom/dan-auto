import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateJobAttachmentInput,
  JobAttachment,
  JobAttachmentKind,
} from "@/lib/types/workshop-data";

type AttachmentRow = {
  id: string;
  job_id: string;
  upload_id: string | null;
  kind: JobAttachmentKind;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  uploaded_by: string;
  created_at: string;
};

function toAttachment(row: AttachmentRow): JobAttachment {
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

function newId() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseAttachmentsRepository = {
  async listByJobId(jobId: string): Promise<JobAttachment[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`[attachments] listByJobId failed: ${error.message}`);
    return (data as AttachmentRow[]).map(toAttachment);
  },

  async create(input: CreateJobAttachmentInput): Promise<JobAttachment> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
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
      .select("*")
      .single();
    if (error) throw new Error(`[attachments] create failed: ${error.message}`);
    return toAttachment(data as AttachmentRow);
  },
};
