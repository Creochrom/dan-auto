import { getStorageBackend } from "@/lib/repositories/backend";
import { uploadRepository } from "@/lib/repositories/upload.repository";
import {
  uploadWorkshopFile,
  resolveWorkshopPreviewUrl,
} from "@/lib/supabase/workshop-storage";
import {
  inferUploadCategory,
  isAllowedMimeType,
  isWorkshopMimeType,
  UPLOAD_MAX_BYTES,
} from "@/lib/upload/validation";
import type { MediaUpload } from "@/lib/types/upload";

export async function resolveUploadPreview(upload: MediaUpload): Promise<MediaUpload> {
  if (getStorageBackend() !== "supabase") return upload;
  const previewUrl = await resolveWorkshopPreviewUrl(upload.previewUrl);
  return previewUrl === upload.previewUrl ? upload : { ...upload, previewUrl };
}

export const uploadService = {
  async storeFile(file: File): Promise<MediaUpload> {
    if (!isAllowedMimeType(file.type)) {
      throw new Error("Only images, short videos and audio notes are accepted");
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new Error("File exceeds 25 MB limit");
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const previewUrl = `data:${file.type};base64,${base64}`;

    return uploadRepository.create({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      category: inferUploadCategory(file.type, file.name),
      previewUrl,
    });
  },

  async getByIds(ids: string[]): Promise<MediaUpload[]> {
    return uploadRepository.findMany(ids);
  },

  /** Workshop admin — images, short video/audio, PDF invoices/damage reports. */
  async storeWorkshopFile(file: File): Promise<MediaUpload> {
    if (!isWorkshopMimeType(file.type)) {
      throw new Error("Workshop uploads: images, video, audio, or PDF only");
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      throw new Error("File exceeds 25 MB limit");
    }

    const buffer = await file.arrayBuffer();

    if (getStorageBackend() === "supabase") {
      const { storagePath, signedUrl } = await uploadWorkshopFile(
        buffer,
        file.type,
        file.name
      );
      const upload = await uploadRepository.create({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        category: inferUploadCategory(file.type, file.name),
        previewUrl: storagePath,
      });
      return { ...upload, previewUrl: signedUrl };
    }

    const base64 = Buffer.from(buffer).toString("base64");
    const previewUrl = `data:${file.type};base64,${base64}`;

    return uploadRepository.create({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      category: inferUploadCategory(file.type, file.name),
      previewUrl,
    });
  },
};
