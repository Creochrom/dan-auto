"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { WorkshopTrainingChat } from "@/features/copilot/components/WorkshopTrainingChat";
import { askWorkshopCopilot } from "@/features/copilot/services/copilot-client";

type GoldenQueryResult = {
  query: string;
  sourceCount: number;
  status: "idle" | "running" | "pass" | "fail";
  error?: string;
};

const GOLDEN_QUERIES = [
  "BMW N47 timing chain symptoms and checks",
  "MOT brake imbalance fail thresholds and process",
] as const;

export default function AdminTrainingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checksRunning, setChecksRunning] = useState(false);
  const [checks, setChecks] = useState<GoldenQueryResult[]>(
    GOLDEN_QUERIES.map((query) => ({ query, sourceCount: 0, status: "idle" }))
  );

  async function runGoldenChecks() {
    if (checksRunning) return;
    setChecksRunning(true);
    setChecks(GOLDEN_QUERIES.map((query) => ({ query, sourceCount: 0, status: "running" })));

    const results: GoldenQueryResult[] = [];
    for (const query of GOLDEN_QUERIES) {
      try {
        const result = await askWorkshopCopilot({
          message: query,
          promptKind: "diagnostics",
          context: "Golden-query verification run for BMW/MOT retrieval confidence.",
        });
        const count = result.sources.length;
        results.push({
          query,
          sourceCount: count,
          status: count > 0 ? "pass" : "fail",
          error: count > 0 ? undefined : "No sources retrieved.",
        });
      } catch (err) {
        results.push({
          query,
          sourceCount: 0,
          status: "fail",
          error: err instanceof Error ? err.message : "Request failed",
        });
      }
    }

    setChecks(results);
    setChecksRunning(false);
  }

  useEffect(() => {
    void adminFetch("/api/admin/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          router.replace("/admin/login?from=/admin/training");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/admin/login?from=/admin/training"));
  }, [router]);

  if (!ready) {
    return (
      <main className="admin-content-wrap max-w-3xl py-12">
        <p className="text-sm text-zinc-500">Loading training room…</p>
      </main>
    );
  }

  return (
    <main className="admin-content-wrap max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">AI training</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Chat with the workshop copilot — for staff practice and knowledge checks
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#d4a63c] hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4">
        <Link href="/admin/knowledge" className="text-sm text-cyan hover:underline">
          Upload manuals →
        </Link>
      </div>

      <section className="premium-card mb-4 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white">Golden-query checklist (BMW / MOT)</h2>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          <li>1. Upload BMW/MOT source docs in Knowledge Uploads.</li>
          <li>2. Ask: "BMW N47 timing chain symptoms and checks".</li>
          <li>3. Ask: "MOT brake imbalance fail thresholds and process".</li>
          <li>4. Confirm each response references workshop docs and is not generic-only.</li>
          <li>5. Pass when POST `/api/copilot` returns non-empty `sources[]` for both queries.</li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void runGoldenChecks()}
            disabled={checksRunning}
            className="inline-flex items-center rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 text-xs font-medium text-cyan hover:border-cyan/70 disabled:opacity-60"
          >
            {checksRunning ? "Running checks..." : "Run golden checks"}
          </button>
          <p className="text-xs text-zinc-500">
            This calls POST `/api/copilot` for both queries and verifies `sources[]` count.
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {checks.map((check) => (
            <li
              key={check.query}
              className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-zinc-300"
            >
              <p className="font-medium text-zinc-100">{check.query}</p>
              <p className="mt-1">
                Status:{" "}
                <span
                  className={
                    check.status === "pass"
                      ? "text-emerald-300"
                      : check.status === "fail"
                        ? "text-rose-300"
                        : "text-zinc-400"
                  }
                >
                  {check.status}
                </span>
                {" · "}sources: {check.sourceCount}
              </p>
              {check.error ? <p className="mt-1 text-rose-300">{check.error}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <WorkshopTrainingChat />
    </main>
  );
}
