"use client";

import { useRef } from "react";
import { Film, ImagePlus, Loader2, X } from "lucide-react";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import { UPLOAD_ACCEPT, UPLOAD_MAX_FILES, formatUploadSize } from "@/lib/upload/validation";
import type { LocalUploadItem } from "@/features/booking/hooks/useMediaUpload";

type Props = {
  items: LocalUploadItem[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (localId: string) => void;
  disabled?: boolean;
};

export function IntakeMediaUpload({ items, onAdd, onRemove, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3">
      <p className="text-[11px] leading-relaxed text-zinc-400">
        {BOOKING_INTAKE_COPY.uploadHint}
      </p>
      <button
        type="button"
        disabled={disabled || items.length >= UPLOAD_MAX_FILES}
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#d4a63c]/30 bg-[#d4a63c]/[0.04] px-3 py-2.5 text-[11px] font-semibold text-[#e8d4a8] transition hover:border-[#d4a63c]/50 disabled:opacity-40"
      >
        <ImagePlus className="h-4 w-4" aria-hidden />
        {BOOKING_INTAKE_COPY.uploadButton}
        <span className="text-zinc-600">
          ({items.length}/{UPLOAD_MAX_FILES})
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.localId}
              className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-black/60"
            >
              {item.file.type.startsWith("video/") ? (
                <div className="flex aspect-square flex-col items-center justify-center gap-1 p-2 text-zinc-500">
                  <Film className="h-6 w-6 text-[#d4a63c]/70" />
                  <span className="line-clamp-2 text-center text-[9px]">
                    {item.file.name}
                  </span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              )}
              {item.status === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                  <Loader2 className="h-5 w-5 animate-spin text-[#d4a63c]" />
                  <span className="mt-1 text-[10px] text-zinc-400">{item.progress}%</span>
                </div>
              )}
              {item.status === "error" && (
                <p className="absolute inset-x-0 bottom-0 bg-red-950/90 px-1 py-0.5 text-[9px] text-red-300">
                  {item.error}
                </p>
              )}
              <button
                type="button"
                onClick={() => onRemove(item.localId)}
                className="absolute right-1 top-1 rounded-md bg-black/80 p-0.5 text-zinc-400 hover:text-white"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="truncate px-1.5 py-1 text-[9px] text-zinc-500">
                {formatUploadSize(item.file.size)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
