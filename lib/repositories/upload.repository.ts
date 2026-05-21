import { mockStore } from "@/lib/repositories/mock-store";
import type { MediaUpload, UploadCategory } from "@/lib/types/upload";

function newId() {
  return `upl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const uploadRepository = {
  findById(id: string): MediaUpload | undefined {
    return mockStore.uploads.find((u) => u.id === id);
  },

  findMany(ids: string[]): MediaUpload[] {
    return ids
      .map((id) => mockStore.uploads.find((u) => u.id === id))
      .filter((u): u is MediaUpload => Boolean(u));
  },

  create(input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: UploadCategory;
    previewUrl: string;
  }): MediaUpload {
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
