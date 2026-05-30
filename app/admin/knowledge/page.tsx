"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, Loader2, RefreshCw, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";

type KnowledgeDocument = {
  id: string;
  name: string;
  createdAt?: string;
  sizeInBytes?: number;
};

type DocsResponse = {
  ok?: boolean;
  data?: { documents?: KnowledgeDocument[] };
  error?: string;
};

function normalizeKnowledgeError(message: string): string {
  const text = message.trim();
  if (!text) return "Knowledge request failed.";
  if (text.includes("AnythingLLM is not configured")) {
    return "Knowledge is unavailable: AnythingLLM is not configured (check ANYTHINGLLM_* env vars).";
  }
  if (text.includes("Workspace lookup failed")) {
    return "Could not load documents from AnythingLLM workspace. Verify workspace slug and API key.";
  }
  if (text.includes("Upload failed")) {
    return `Upload failed in AnythingLLM: ${text}`;
  }
  return text;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

export default function AdminKnowledgePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUploadName, setLastUploadName] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/knowledge/documents", { credentials: "include" });
      if (res.status === 401) {
        router.replace("/admin/login?from=/admin/knowledge");
        return;
      }
      const json = (await res.json().catch(() => null)) as DocsResponse | null;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Could not load knowledge documents.");
      }
      setDocuments(Array.isArray(json.data?.documents) ? json.data!.documents! : []);
    } catch (err) {
      setError(
        normalizeKnowledgeError(
          err instanceof Error ? err.message : "Could not load knowledge documents."
        )
      );
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const onUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);
      setSuccess(null);
      try {
        const form = new FormData();
        form.append("file", file, file.name);

        const res = await adminFetch("/api/knowledge/upload", {
          method: "POST",
          credentials: "include",
          body: form,
        });

        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "Upload failed.");
        }

        setSuccess(`Uploaded: ${file.name}`);
        setLastUploadName(file.name);
        await loadDocuments();
      } catch (err) {
        setError(normalizeKnowledgeError(err instanceof Error ? err.message : "Upload failed."));
      } finally {
        setUploading(false);
        event.currentTarget.value = "";
      }
    },
    [loadDocuments]
  );

  const sortedDocs = useMemo(
    () =>
      [...documents].sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      }),
    [documents]
  );

  return (
    <main className="admin-content-wrap max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Knowledge Uploads</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add workshop manuals to the copilot knowledge base.
          </p>
        </div>
        <Link href="/admin/training" className="text-sm text-[#d4a63c] hover:underline">
          ← AI training
        </Link>
      </div>

      <AdminQuickLinks active="workshop-assistant" />

      <section className="premium-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d4a63c]/40 bg-[#d4a63c]/10 px-4 py-2 text-sm font-medium text-[#e8d5a3] hover:border-[#d4a63c]/60">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload manual"}
            <input
              type="file"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.txt,.md,.csv"
            />
          </label>

          <button
            type="button"
            onClick={() => void loadDocuments()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-white/30 hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Supports PDF, DOC/DOCX, TXT, MD, CSV up to 50MB. Uploaded docs go to
          `dan-auto-workshop` in AnythingLLM.
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          If uploads succeed but retrieval still shows zero sources, wait 10-30 seconds for indexing
          and run the golden checks from AI training.
        </p>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        )}
      </section>

      <section className="premium-card mt-4 rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Workspace documents</h2>
          <span className="text-xs text-zinc-500">{sortedDocs.length} items</span>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading documents...</p>
        ) : sortedDocs.length === 0 ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
            <p className="inline-flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              No manuals uploaded yet
            </p>
            <p className="mt-1 text-xs text-amber-200/90">
              Upload BMW/MOT manuals first, then run the golden-query checklist from AI training.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] px-3 py-2"
              >
                <div className="min-w-0 flex flex-1 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                  <p className="min-w-0 truncate text-sm text-zinc-200">{doc.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{formatBytes(doc.sizeInBytes)}</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lastUploadName && sortedDocs.length > 0 && (
          <p className="mt-3 text-xs text-zinc-500">
            Last uploaded: <span className="text-zinc-300">{lastUploadName}</span>. If this file does
            not appear, retry in 10-20 seconds and then refresh.
          </p>
        )}
      </section>
    </main>
  );
}
