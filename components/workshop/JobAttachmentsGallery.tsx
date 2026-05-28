"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { AttachmentLightbox } from "@/components/workshop/AttachmentLightbox";
import type { JobAttachment } from "@/lib/types/job";
import type { MediaUpload } from "@/lib/types/upload";

type Props = {
  attachments: JobAttachment[];
};

type LightboxState = {
  fileName: string;
  mimeType?: string;
  uploadId?: string;
} | null;

export function JobAttachmentsGallery({ attachments }: Props) {
  const [uploads, setUploads] = useState<Record<string, MediaUpload>>({});
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  useEffect(() => {
    const ids = attachments
      .map((a) => a.uploadId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      setUploads({});
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await adminFetch("/api/admin/uploads/batch", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          data?: { uploads?: Record<string, MediaUpload> };
        } | null;
        if (!cancelled && res.ok && json?.ok && json.data?.uploads) {
          setUploads(json.data.uploads);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachments]);

  const openAttachment = useCallback((file: JobAttachment) => {
    setLightbox({
      fileName: file.fileName,
      mimeType: file.mimeType,
      uploadId: file.uploadId,
    });
  }, []);

  if (attachments.length === 0) return null;

  const lightboxUpload = lightbox?.uploadId ? uploads[lightbox.uploadId] : undefined;

  return (
    <>
      {loading && Object.keys(uploads).length === 0 ? (
        <p className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading files…
        </p>
      ) : null}

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {attachments.map((file) => {
          const upload = file.uploadId ? uploads[file.uploadId] : undefined;
          const isImage =
            file.kind === "photo" ||
            file.mimeType?.startsWith("image/") ||
            /\.(jpe?g|png|webp|gif)$/i.test(file.fileName);
          const isPdf =
            file.mimeType === "application/pdf" || file.fileName.toLowerCase().endsWith(".pdf");
          const thumb = upload?.previewUrl;

          return (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => openAttachment(file)}
                className="group w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 text-left transition hover:border-[#d4a63c]/40 hover:ring-1 hover:ring-[#d4a63c]/25"
              >
                {isImage && thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-black/40 px-2">
                    {isPdf ? (
                      <FileText className="h-8 w-8 text-[#d4a63c]" />
                    ) : isImage ? (
                      <ImageIcon className="h-8 w-8 text-cyan" />
                    ) : (
                      <FileText className="h-8 w-8 text-zinc-500" />
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {isPdf ? "PDF" : file.kind}
                    </span>
                  </div>
                )}
                <p className="truncate px-2 py-1.5 text-[10px] text-zinc-400 group-hover:text-zinc-200">
                  {file.fileName}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <AttachmentLightbox
        open={Boolean(lightbox)}
        fileName={lightbox?.fileName ?? ""}
        mimeType={lightbox?.mimeType}
        upload={lightboxUpload}
        onClose={() => setLightbox(null)}
      />
    </>
  );
}
