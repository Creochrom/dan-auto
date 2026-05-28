/**
 * Workshop file storage in Supabase Storage (admin uploads).
 * Persists object paths like `workshop/{id}/{file}` in uploads.preview_url;
 * API responses use short-lived signed URLs for reads.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

const WORKSHOP_PATH_PREFIX = "workshop/";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export function getWorkshopStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "workshop-uploads";
}

export function isWorkshopStoragePath(previewUrl: string): boolean {
  return previewUrl.startsWith(WORKSHOP_PATH_PREFIX);
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  return base || "file";
}

function newStoragePath(fileName: string): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return `${WORKSHOP_PATH_PREFIX}${id}/${sanitizeFileName(fileName)}`;
}

export async function uploadWorkshopFile(
  bytes: ArrayBuffer,
  mimeType: string,
  fileName: string
): Promise<{ storagePath: string; signedUrl: string }> {
  const supabase = getSupabaseServerClient();
  const bucket = getWorkshopStorageBucket();
  const storagePath = newStoragePath(fileName);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`[workshop-storage] upload failed: ${uploadError.message}`);
  }

  const signedUrl = await createWorkshopSignedUrl(storagePath);
  return { storagePath, signedUrl };
}

export async function createWorkshopSignedUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const bucket = getWorkshopStorageBucket();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(
      `[workshop-storage] signed URL failed: ${error?.message ?? "no URL returned"}`
    );
  }

  return data.signedUrl;
}

/** Replace a stored storage path with a fresh signed URL for client use. */
export async function resolveWorkshopPreviewUrl(previewUrl: string): Promise<string> {
  if (!isWorkshopStoragePath(previewUrl)) return previewUrl;
  return createWorkshopSignedUrl(previewUrl);
}
