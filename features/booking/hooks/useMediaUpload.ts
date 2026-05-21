"use client";

import { useCallback, useState } from "react";
import { uploadMediaFile } from "@/lib/api/client";
import { UPLOAD_MAX_FILES } from "@/lib/upload/validation";
import type { MediaUpload } from "@/lib/types/upload";

export type LocalUploadItem = {
  localId: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  upload?: MediaUpload;
};

export function useMediaUpload() {
  const [items, setItems] = useState<LocalUploadItem[]>([]);

  const uploadOne = useCallback(async (localId: string, file: File) => {
    try {
      const { upload } = await uploadMediaFile(file, (pct) => {
        setItems((prev) =>
          prev.map((it) =>
            it.localId === localId ? { ...it, progress: pct } : it
          )
        );
      });
      setItems((prev) =>
        prev.map((it) =>
          it.localId === localId
            ? { ...it, status: "done", progress: 100, upload }
            : it
        )
      );
    } catch (e) {
      setItems((prev) =>
        prev.map((it) =>
          it.localId === localId
            ? {
                ...it,
                status: "error",
                error: e instanceof Error ? e.message : "Upload failed",
              }
            : it
        )
      );
    }
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files);
      for (const file of incoming) {
        let localId: string | null = null;
        setItems((prev) => {
          if (prev.length >= UPLOAD_MAX_FILES) return prev;
          localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const previewUrl = URL.createObjectURL(file);
          return [
            ...prev,
            {
              localId,
              file,
              previewUrl,
              progress: 0,
              status: "uploading",
            },
          ];
        });
        if (!localId) break;
        await uploadOne(localId, file);
      }
    },
    [uploadOne]
  );

  const remove = useCallback((localId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.localId === localId);
      if (item?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.localId !== localId);
    });
  }, []);

  const uploadIds = items
    .filter((i) => i.status === "done" && i.upload)
    .map((i) => i.upload!.id);

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((i) => {
        if (i.previewUrl.startsWith("blob:")) URL.revokeObjectURL(i.previewUrl);
      });
      return [];
    });
  }, []);

  return { items, addFiles, remove, uploadIds, clear };
}
