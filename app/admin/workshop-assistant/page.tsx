"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin/client";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { WorkshopAssistant } from "@/features/copilot/components/WorkshopAssistant";
import { useWorkshopJobParams } from "@/features/copilot/hooks/useWorkshopJobParams";
import type { Job } from "@/lib/types/job";

type JobsApiResponse = { ok: true; data: Job[] } | { ok: false; error: string };

function WorkshopAssistantContent({
  jobs,
}: {
  jobs: Array<{ id: string; registration: string; service: string }>;
}) {
  const { jobId, reg, jobStub } = useWorkshopJobParams();

  return (
    <WorkshopAssistant
      jobStub={jobStub}
      queryJobId={jobId}
      queryReg={reg}
      initialJobs={jobs}
    />
  );
}

export default function WorkshopAssistantPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [jobs, setJobs] = useState<
    Array<{ id: string; registration: string; service: string }>
  >([]);

  useEffect(() => {
    void adminFetch("/api/admin/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          router.replace("/admin/login?from=/admin/workshop-assistant");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/admin/login?from=/admin/workshop-assistant"));
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    void adminFetch("/api/jobs", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return;
        const json = (await r.json()) as JobsApiResponse;
        if (!json.ok) return;
        setJobs(
          json.data.slice(0, 50).map((j) => ({
            id: j.id,
            registration: j.registration,
            service: j.service,
          }))
        );
      })
      .catch(() => {
        // Non-blocking: assistant still works without picker data.
      });
  }, [ready]);

  if (!ready) {
    return (
      <main className="admin-content-wrap max-w-5xl py-10">
        <p className="text-base text-zinc-500">Loading workshop assistant…</p>
      </main>
    );
  }

  return (
    <main className="admin-content-wrap flex min-h-[100dvh] max-w-5xl flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pt-4">
      <header className="mb-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white sm:text-xl">Workshop Assistant</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Drafts for the bay — you copy and send to the customer
            </p>
          </div>
          <Link
            href="/admin/leads"
            className="shrink-0 rounded-lg px-2 py-2 text-sm text-[#d4a63c] hover:bg-[#d4a63c]/10"
          >
            Inbox
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <AdminQuickLinks active="workshop-assistant" />
        </div>
      </header>

      <Suspense
        fallback={
          <p className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading job context…
          </p>
        }
      >
        <WorkshopAssistantContent jobs={jobs} />
      </Suspense>
    </main>
  );
}
