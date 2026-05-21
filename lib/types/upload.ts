/**
 * Media uploads — mock storage now; Supabase + Gemini Vision later.
 */

export type UploadCategory =
  | "warning_light"
  | "noise_video"
  | "damage"
  | "leak"
  | "smoke"
  | "tyre"
  | "suspension"
  | "general";

export type MediaUpload = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: UploadCategory;
  /** Mock preview — future: signed cloud URL */
  previewUrl: string;
  /** Future: Gemini analysis payload */
  visionReady: boolean;
  createdAt: string;
};

export type CreateUploadResult = {
  upload: MediaUpload;
};
