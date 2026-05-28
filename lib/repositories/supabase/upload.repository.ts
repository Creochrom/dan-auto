/**
 * Supabase implementation of the upload repository.
 * Mirrors the interface of lib/repositories/upload.repository.ts exactly.
 * Only active when STORAGE_BACKEND=supabase.
 *
 * previewUrl is stored as TEXT: base64 data URLs (legacy) or a storage path
 * (`workshop/...`) when Supabase Storage is used — signed URLs are minted at read time.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MediaUpload, UploadCategory } from "@/lib/types/upload";

type UploadRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  category: UploadCategory;
  preview_url: string;
  vision_ready: boolean;
  created_at: string;
};

function toUpload(row: UploadRow): MediaUpload {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    category: row.category,
    previewUrl: row.preview_url,
    visionReady: row.vision_ready,
    createdAt: row.created_at,
  };
}

function newId() {
  return `upl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseUploadRepository = {
  async findById(id: string): Promise<MediaUpload | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`[uploads] findById failed: ${error.message}`);
    if (!data) return undefined;
    return toUpload(data as UploadRow);
  },

  async findMany(ids: string[]): Promise<MediaUpload[]> {
    if (!ids.length) return [];
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .in("id", ids);

    if (error) throw new Error(`[uploads] findMany failed: ${error.message}`);
    const rows = (data as UploadRow[]).map(toUpload);
    // Return in the same order the caller requested.
    return ids
      .map((id) => rows.find((r) => r.id === id))
      .filter((r): r is MediaUpload => Boolean(r));
  },

  async create(input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    category: UploadCategory;
    previewUrl: string;
  }): Promise<MediaUpload> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const row: UploadRow = {
      id: newId(),
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      category: input.category,
      preview_url: input.previewUrl,
      vision_ready: input.mimeType.startsWith("image/"),
      created_at: now,
    };

    const { data, error } = await supabase
      .from("uploads")
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`[uploads] create failed: ${error.message}`);
    return toUpload(data as UploadRow);
  },
};
