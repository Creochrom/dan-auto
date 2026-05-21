import { uploadRepository } from "@/lib/repositories/upload.repository";
import {
  inferUploadCategory,
  isAllowedMimeType,
  UPLOAD_MAX_BYTES,
} from "@/lib/upload/validation";
import type { MediaUpload } from "@/lib/types/upload";

export const uploadService = {
  async storeFile(file: File): Promise<MediaUpload> {
    if (!isAllowedMimeType(file.type)) {
      throw new Error("Only images and videos are accepted");
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

  getByIds(ids: string[]): MediaUpload[] {
    return uploadRepository.findMany(ids);
  },
};
