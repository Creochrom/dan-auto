"use client";

import Link from "next/link";
import { WorkshopAssistant } from "@/features/copilot/components/WorkshopAssistant";
import { VehicleHealthSummary } from "@/components/vehicle/VehicleHealthSummary";
import { VehicleIntelligencePanel } from "@/components/vehicle/VehicleIntelligencePanel";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import type { VehicleHistory } from "@/lib/services/vehicle-history.service";
import type { Job } from "@/lib/types/job";

type Props = {
  job: Job | null;
  jobsForAssistant: Array<{ id: string; registration: string; service: string }>;
  history: VehicleHistory | null;
  historyLoading: boolean;
  historyError: string | null;
  vehicleReport: VehicleReport | null;
  vehicleLoading: boolean;
  vehicleError: string | null;
};

export function JobContextPanel({
  job,
  jobsForAssistant,
  history,
  historyLoading,
  historyError,
  vehicleReport,
  vehicleLoading,
  vehicleError,
}: Props) {
  return (
    <aside className="space-y-4">
      {job && (
        <div className="premium-card rounded-2xl p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Vehicle · Job · Memory
            </p>
            <Link
              href={`/admin/vehicle/${encodeURIComponent(job.registration)}`}
              className="text-xs text-[#d4a63c] hover:underline"
            >
              Full memory
            </Link>
          </div>
          {vehicleLoading ? (
            <p className="text-xs text-zinc-500">Loading DVLA…</p>
          ) : vehicleError ? (
            <p className="text-xs text-amber-200/90">{vehicleError}</p>
          ) : vehicleReport ? (
            <div className="space-y-3">
              <VehicleHealthSummary report={vehicleReport} />
              <VehicleIntelligencePanel
                report={vehicleReport}
                registration={job.registration}
                assistantHref={`/admin/workshop-assistant?jobId=${encodeURIComponent(job.id)}&reg=${encodeURIComponent(job.registration)}`}
              />
            </div>
          ) : null}
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            {historyLoading ? (
              <p className="text-xs text-zinc-500">Loading workshop history…</p>
            ) : historyError ? (
              <p className="text-xs text-rose-300">{historyError}</p>
            ) : history ? (
              <div className="space-y-1 text-xs text-zinc-400">
                <p>
                  Returning:{" "}
                  <span className="text-zinc-200">
                    {history.memory?.returning ? "Yes" : "No"}
                  </span>
                </p>
                <p>
                  Jobs: <span className="text-zinc-200">{history.jobs.length}</span> ·
                  Bookings: <span className="text-zinc-200">{history.bookings.length}</span>
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="premium-card min-h-[24rem] rounded-2xl p-3 lg:min-h-[28rem]">
        <p className="mb-2 px-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
          Workshop Assistant
        </p>
        <WorkshopAssistant
          queryJobId={job?.id}
          queryReg={job?.registration}
          jobStub={
            job
              ? {
                  jobId: job.id,
                  reg: job.registration,
                  displayLabel: `${job.registration} · ${job.service}`,
                  contextLine: [
                    `Registration: ${job.registration}`,
                    `Customer: ${job.customerName}`,
                    `Service: ${job.service}`,
                    `Symptoms: ${job.symptomsText ?? "Not recorded"}`,
                  ].join(" · "),
                  symptomSummary: job.symptomsText ?? undefined,
                }
              : null
          }
          initialJobs={jobsForAssistant}
        />
      </div>
    </aside>
  );
}
