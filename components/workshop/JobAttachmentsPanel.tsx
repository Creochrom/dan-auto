"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { WORKSHOP_UPLOAD_ACCEPT } from "@/lib/upload/validation";
import { JobAttachmentsGallery } from "@/components/workshop/JobAttachmentsGallery";
import type { JobAttachment } from "@/lib/types/job";

type Props = {
  jobId: string;
  attachments: JobAttachment[];
  disabled?: boolean;
  onUploaded: () => void;
};

export function JobAttachmentsPanel({
  jobId,
  attachments,
  disabled,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled) return;
      setUploading(true);
      setError(null);

      try {
        const uploaded: Array<{
          uploadId: string;
          kind: "photo" | "document";
          fileName: string;
          mimeType: string;
          sizeBytes: number;
        }> = [];

        for (const file of Array.from(files)) {
          const form = new FormData();
          form.append("file", file);
          const upRes = await adminFetch("/api/admin/uploads", {
            method: "POST",
            credentials: "include",
            body: form,
          });
          const upJson = (await upRes.json().catch(() => null)) as {
            ok?: boolean;
            data?: { upload?: { id: string } };
            error?: string;
          } | null;
          if (!upRes.ok || !upJson?.ok || !upJson.data?.upload?.id) {
            throw new Error(upJson?.error ?? `Upload failed: ${file.name}`);
          }
          uploaded.push({
            uploadId: upJson.data.upload.id,
            kind: file.type === "application/pdf" ? "document" : "photo",
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          });
        }

        const patchRes = await adminFetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attachments: uploaded }),
        });
        const patchJson = (await patchRes.json().catch(() => null)) as {
          ok?: boolean;
          data?: {
            job?: unknown;
            attachments?: JobAttachment[];
            timeline?: unknown[];
          };
          error?: string;
        } | null;
        if (!patchRes.ok || !patchJson?.ok) {
          throw new Error(patchJson?.error ?? "Could not attach files to job.");
        }

        onUploaded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [attachments, disabled, jobId, onUploaded]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d4a63c]/30 bg-[#d4a63c]/10 px-4 text-xs font-semibold text-[#e8d5a3] hover:border-[#d4a63c]/50 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Add photos / PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={WORKSHOP_UPLOAD_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <p className="text-[11px] text-zinc-500">Damage pics, invoices, PDFs — up to 25 MB each.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </p>
      )}

      {attachments.length === 0 ? (
        <p className="text-xs text-zinc-600">No files on this job yet.</p>
      ) : (
        <JobAttachmentsGallery attachments={attachments} />
      )}
    </div>
  );
}
