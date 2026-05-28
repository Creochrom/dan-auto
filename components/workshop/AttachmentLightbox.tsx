"use client";

import { useEffect } from "react";
import { FileText, X } from "lucide-react";
import type { MediaUpload } from "@/lib/types/upload";

type Props = {
  open: boolean;
  fileName: string;
  mimeType?: string;
  upload?: MediaUpload | null;
  onClose: () => void;
};

export function AttachmentLightbox({ open, fileName, mimeType, upload, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const src = upload?.previewUrl;
  const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isImage =
    mimeType?.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(fileName);

  return (
    <div
      className="fixed inset-0 z-[220] flex flex-col bg-black/95"
      role="dialog"
      aria-modal
      aria-label={fileName}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="truncate text-sm text-zinc-200">{fileName}</p>
        <div className="flex shrink-0 items-center gap-2">
          {src && (
            <a
              href={src}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!src ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <FileText className="h-12 w-12" />
            <p className="text-sm">Loading preview…</p>
          </div>
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={fileName}
            className="max-h-[85vh] max-w-full object-contain"
          />
        ) : isPdf ? (
          <iframe
            title={fileName}
            src={src}
            className="h-[85vh] w-full max-w-4xl rounded-lg border border-white/10 bg-white"
          />
        ) : (
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-zinc-500" />
            <p className="mt-3 text-sm text-zinc-400">Preview not available for this type.</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-[#d4a63c] hover:underline"
            >
              Open file
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
