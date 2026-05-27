"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, Mic, Paperclip, X } from "lucide-react";
import { ADVISOR_MEDIA_HINT } from "@/lib/config/advisor-copy";
import {
  UPLOAD_ACCEPT,
  UPLOAD_MAX_FILES,
  formatUploadSize,
} from "@/lib/upload/validation";
import type { LocalUploadItem } from "@/features/booking/hooks/useMediaUpload";

type Props = {
  items: LocalUploadItem[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (localId: string) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function AdvisorMediaBar({
  items,
  onAdd,
  onRemove,
  disabled,
  compact,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const doneCount = items.filter((i) => i.status === "done").length;
  const uploading = items.some((i) => i.status === "uploading");

  const handleFiles = (files: FileList | File[] | null | undefined) => {
    if (!files?.length || disabled || items.length >= UPLOAD_MAX_FILES) return;
    onAdd(files);
  };

  return (
    <div className={`advisor-media-bar ${compact ? "advisor-media-bar--compact" : ""}`}>
      {!compact && (
        <p className="advisor-media-bar__hint">{ADVISOR_MEDIA_HINT}</p>
      )}

      <div className="advisor-media-bar__row">
        <button
          type="button"
          disabled={disabled || items.length >= UPLOAD_MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="advisor-media-bar__attach"
          aria-label="Attach photo or video"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Paperclip className="h-3.5 w-3.5" aria-hidden />
          )}
          <span>Photo / video</span>
        </button>
        <button
          type="button"
          disabled={disabled || items.length >= UPLOAD_MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="advisor-media-bar__attach advisor-media-bar__attach--secondary"
          aria-label="Attach audio note"
          title="Short audio note (optional)"
        >
          <Mic className="h-3.5 w-3.5" aria-hidden />
          <span>Audio</span>
        </button>
        {doneCount > 0 && (
          <span className="advisor-media-bar__count">
            {doneCount} attached for workshop
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <ul className="advisor-media-bar__thumbs">
          {items.map((item) => (
            <li key={item.localId} className="advisor-media-bar__thumb">
              {item.file.type.startsWith("video/") ? (
                <div className="advisor-media-bar__thumb-placeholder">
                  <ImagePlus className="h-4 w-4 opacity-50" aria-hidden />
                </div>
              ) : item.file.type.startsWith("audio/") ? (
                <div className="advisor-media-bar__thumb-placeholder">
                  <Mic className="h-4 w-4 opacity-50" aria-hidden />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
              )}
              {item.status === "uploading" && (
                <span className="advisor-media-bar__thumb-progress">{item.progress}%</span>
              )}
              {item.status === "error" && (
                <span className="advisor-media-bar__thumb-error" title={item.error}>
                  Failed
                </span>
              )}
              <button
                type="button"
                className="advisor-media-bar__thumb-remove"
                onClick={() => onRemove(item.localId)}
                aria-label={`Remove ${item.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
              <span className="sr-only">
                {item.file.name}, {formatUploadSize(item.file.size)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
