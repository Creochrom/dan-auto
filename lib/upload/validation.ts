/**
 * Client/server upload validation — shared rules.
 */

export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_MAX_FILES = 6;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/webm", "audio/wav", "audio/ogg"];
const WORKSHOP_DOC_TYPES = ["application/pdf"];

export const UPLOAD_ACCEPT = [
  ...IMAGE_TYPES,
  ...VIDEO_TYPES,
  ...AUDIO_TYPES,
].join(",");

export function isAllowedMimeType(mime: string): boolean {
  return (
    IMAGE_TYPES.includes(mime) ||
    VIDEO_TYPES.includes(mime) ||
    AUDIO_TYPES.includes(mime)
  );
}

/** Admin bay uploads — photos, video, audio, PDF invoices/damage docs. */
export function isWorkshopMimeType(mime: string): boolean {
  return isAllowedMimeType(mime) || WORKSHOP_DOC_TYPES.includes(mime);
}

export const WORKSHOP_UPLOAD_ACCEPT = [
  ...IMAGE_TYPES,
  ...VIDEO_TYPES,
  ...AUDIO_TYPES,
  ...WORKSHOP_DOC_TYPES,
].join(",");

export function inferUploadCategory(mime: string, fileName: string): import("@/lib/types/upload").UploadCategory {
  const lower = fileName.toLowerCase();
  if (mime.startsWith("audio/")) return "noise_video";
  if (mime.startsWith("video/") || /noise|sound|rattle/.test(lower)) return "noise_video";
  if (/light|dash|warning|eml/.test(lower)) return "warning_light";
  if (/leak|oil|fluid|coolant/.test(lower)) return "leak";
  if (/smoke|exhaust/.test(lower)) return "smoke";
  if (/tyre|tire|wheel/.test(lower)) return "tyre";
  if (/suspension|shock|spring/.test(lower)) return "suspension";
  if (/damage|dent|scratch|crash/.test(lower)) return "damage";
  return "general";
}

export function formatUploadSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
