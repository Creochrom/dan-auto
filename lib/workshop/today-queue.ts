/**
 * Today queue column mapping (WORKSHOP_ECOSYSTEM.md).
 */

import type { Job, JobStatus } from "@/lib/types/job";

export const TODAY_COLUMN_IDS = [
  "arriving",
  "on_ramp",
  "waiting_parts",
  "waiting_customer",
  "ready",
  "done",
] as const;

export type TodayColumnId = (typeof TODAY_COLUMN_IDS)[number];

export const TODAY_COLUMNS: {
  id: TodayColumnId;
  label: string;
  statuses: readonly JobStatus[];
}[] = [
  { id: "arriving", label: "Arriving", statuses: ["booked", "checked_in"] },
  {
    id: "on_ramp",
    label: "On ramp",
    statuses: ["diagnosing", "in_progress", "quality_check"],
  },
  { id: "waiting_parts", label: "Waiting parts", statuses: ["awaiting_parts"] },
  {
    id: "waiting_customer",
    label: "Waiting customer",
    statuses: ["awaiting_approval"],
  },
  { id: "ready", label: "Ready", statuses: ["ready_for_collection"] },
  { id: "done", label: "Done", statuses: ["collected", "cancelled"] },
];

const STATUS_TO_COLUMN = new Map<JobStatus, TodayColumnId>();
for (const col of TODAY_COLUMNS) {
  for (const status of col.statuses) {
    STATUS_TO_COLUMN.set(status, col.id);
  }
}

export function todayColumnForStatus(status: JobStatus): TodayColumnId {
  return STATUS_TO_COLUMN.get(status) ?? "on_ramp";
}

export function isActiveFloorJob(status: JobStatus): boolean {
  return status !== "collected" && status !== "cancelled";
}

export function groupJobsByTodayColumn(jobs: Job[]): Record<TodayColumnId, Job[]> {
  const groups = Object.fromEntries(
    TODAY_COLUMN_IDS.map((id) => [id, [] as Job[]])
  ) as Record<TodayColumnId, Job[]>;

  for (const job of jobs) {
    const col = todayColumnForStatus(job.status);
    groups[col].push(job);
  }

  for (const id of TODAY_COLUMN_IDS) {
    groups[id].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  return groups;
}

export type TodayOwnerCounts = {
  onRamp: number;
  waitingParts: number;
  waitingCustomer: number;
  ready: number;
  activeJobs: number;
};

export function computeTodayOwnerCounts(jobs: Job[]): TodayOwnerCounts {
  const active = jobs.filter((j) => isActiveFloorJob(j.status));
  return {
    onRamp: active.filter((j) => todayColumnForStatus(j.status) === "on_ramp")
      .length,
    waitingParts: active.filter((j) => j.status === "awaiting_parts").length,
    waitingCustomer: active.filter((j) => j.status === "awaiting_approval")
      .length,
    ready: active.filter((j) => j.status === "ready_for_collection").length,
    activeJobs: active.length,
  };
}
