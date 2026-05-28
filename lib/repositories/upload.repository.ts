import { mockStore } from "@/lib/repositories/mock-store";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseUploadRepository } from "@/lib/repositories/supabase/upload.repository";
import type { MediaUpload, UploadCategory } from "@/lib/types/upload";

function newId() {
  return `upl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const uploadRepository = {
  async findById(id: string): Promise<MediaUpload | undefined> {
    if (getStorageBackend() === "supabase") return supabaseUploadRepository.findById(id);
    return mockStore.uploads.find((u) => u.id === id);
  },

  async findMany(ids: string[]): Promise<MediaUpload[]> {
    if (getStorageBackend() === "supabase") return supabaseUploadRepository.findMany(ids);
    return ids
      .map((id) => mockStore.uploads.find((u) => u.id === id))
      .filter((u): u is MediaUpload => Boolean(u));
  },

  async create(input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: UploadCategory;
    previewUrl: string;
  }): Promise<MediaUpload> {
    if (getStorageBackend() === "supabase") return supabaseUploadRepository.create(input);

    const upload: MediaUpload = {
      id: newId(),
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      category: input.category,
      previewUrl: input.previewUrl,
      visionReady: input.mimeType.startsWith("image/"),
      createdAt: new Date().toISOString(),
    };
    mockStore.uploads.push(upload);
    return upload;
  },
};
