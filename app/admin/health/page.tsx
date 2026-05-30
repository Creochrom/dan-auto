"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";

type HealthCard = {
  id: string;
  title: string;
  href: string;
  loading: boolean;
  error: string | null;
  data: Record<string, unknown> | null;
};

function StatusDot({ ok }: { ok: boolean | undefined }) {
  if (ok === undefined) {
    return <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-600" />;
  }
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`}
    />
  );
}

export default function AdminHealthPage() {
  const router = useRouter();
  const [cards, setCards] = useState<HealthCard[]>([
    { id: "dvla", title: "DVLA plate lookup", href: "/api/health/dvla", loading: true, error: null, data: null },
    {
      id: "storage",
      title: "Workshop storage",
      href: "/api/health/storage",
      loading: true,
      error: null,
      data: null,
    },
    {
      id: "supabase",
      title: "Supabase",
      href: "/api/health/supabase",
      loading: true,
      error: null,
      data: null,
    },
    {
      id: "anythingllm",
      title: "AnythingLLM (workshop RAG)",
      href: "/api/health/anythingllm",
      loading: true,
      error: null,
      data: null,
    },
    { id: "email", title: "Email", href: "/api/health/email", loading: true, error: null, data: null },
  ]);

  const loadAll = useCallback(async () => {
    setCards((prev) => prev.map((c) => ({ ...c, loading: true, error: null })));

    const results = await Promise.all(
      [
        "/api/health/dvla",
        "/api/health/storage",
        "/api/health/supabase",
        "/api/health/anythingllm",
        "/api/health/email",
      ].map(
        async (href) => {
          try {
            const res = await adminFetch(href, { credentials: "include" });
            if (res.status === 401) {
              return { href, unauthorized: true as const, data: null, error: null };
            }
            const json = (await res.json().catch(() => null)) as
              | { ok?: boolean; data?: Record<string, unknown>; error?: string }
              | null;
            if (!res.ok || !json?.ok) {
              return {
                href,
                unauthorized: false as const,
                data: null,
                error: json?.error ?? `HTTP ${res.status}`,
              };
            }
            return { href, unauthorized: false as const, data: json.data ?? null, error: null };
          } catch (err) {
            return {
              href,
              unauthorized: false as const,
              data: null,
              error: err instanceof Error ? err.message : "Request failed",
            };
          }
        }
      )
    );

    if (results.some((r) => r.unauthorized)) {
      router.replace("/admin/login?from=/admin/health");
      return;
    }

    setCards((prev) =>
      prev.map((card, i) => ({
        ...card,
        loading: false,
        data: results[i]?.data ?? null,
        error: results[i]?.error ?? null,
      }))
    );
  }, [router]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <main className="admin-content-wrap max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">System health</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Quick checks for DVLA, workshop storage, database, email, and workshop knowledge.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-white/30"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link href="/admin" className="text-sm text-[#d4a63c] hover:underline">
            ← Hub
          </Link>
        </div>
      </div>

      <AdminQuickLinks active="workshop-assistant" />

      <div className="space-y-4">
        {cards.map((card) => {
          const ready =
            card.id === "dvla"
              ? Boolean(card.data?.ready)
              : card.id === "storage"
                ? Boolean(card.data?.configured && card.data?.reachable)
                : card.id === "supabase"
                ? Boolean(card.data?.connected && card.data?.schemaReady)
                : card.id === "anythingllm"
                  ? Boolean(card.data?.enabled && card.data?.reachable && card.data?.workspaceReady)
                  : Boolean(card.data?.ready);

          return (
            <section key={card.id} className="premium-card rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <StatusDot ok={card.loading ? undefined : card.error ? false : ready} />
                <h2 className="text-sm font-semibold text-white">{card.title}</h2>
              </div>

              {card.loading && <p className="mt-3 text-sm text-zinc-500">Checking…</p>}

              {card.error && (
                <p className="mt-3 text-sm text-rose-300">{card.error}</p>
              )}

              {!card.loading && card.data && (
                <div className="mt-3 space-y-1 text-sm text-zinc-400">
                  {typeof card.data.message === "string" && (
                    <p className="text-zinc-300">{card.data.message}</p>
                  )}
                  {typeof card.data.latencyMs === "number" && (
                    <p>Latency: {card.data.latencyMs} ms</p>
                  )}
                  {card.id === "dvla" && (
                    <>
                      <p>
                        DVLA key:{" "}
                        {card.data.keyValid ? "valid" : card.data.configured ? "invalid" : "missing"}
                      </p>
                      {card.data.motHistory &&
                        typeof card.data.motHistory === "object" && (
                          <p className="text-xs text-zinc-500">
                            MOT History:{" "}
                            {(card.data.motHistory as { ready?: boolean }).ready
                              ? "ready"
                              : (card.data.motHistory as { configured?: boolean }).configured
                                ? "configured but not ready"
                                : "optional — not configured"}
                          </p>
                        )}
                    </>
                  )}
                  {card.id === "storage" && (
                    <>
                      <p>
                        Bucket:{" "}
                        {typeof card.data.bucket === "string"
                          ? card.data.bucket
                          : "—"}
                      </p>
                      <p>
                        Status:{" "}
                        {card.data.reachable
                          ? "reachable"
                          : card.data.configured
                            ? "configured but not reachable"
                            : "not configured"}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-zinc-600">{card.href}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-zinc-600">
        DVLA developer portal:{" "}
        <a
          href="https://developer-portal.driver-vehicle-licensing.api.gov.uk/"
          className="text-zinc-500 underline"
          target="_blank"
          rel="noreferrer"
        >
          driver-vehicle-licensing.api.gov.uk
        </a>
      </p>
    </main>
  );
}
