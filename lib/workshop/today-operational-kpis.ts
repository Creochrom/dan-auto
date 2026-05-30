/**
 * Today dashboard operational KPIs — workshop floor decisions, not BI.
 * Data source: full jobs list from GET /api/jobs (same array as work queue).
 */

import type { Job, JobStatus } from "@/lib/types/job";
import { computeCompletedJobKpis } from "@/lib/workshop/completed-jobs";

const CARS_ON_SITE_STATUSES: readonly JobStatus[] = [
  "checked_in",
  "in_progress",
  "awaiting_parts",
  "ready_for_collection",
];

export type TodayOperationalKpis = {
  carsOnSite: number;
  waitingParts: number;
  awaitingApprovalCount: number;
  awaitingApprovalPipelinePence: number;
  readyForCollection: number;
  collectedToday: number;
  completedRevenuePence: number;
};

export function computeTodayOperationalKpis(jobs: Job[]): TodayOperationalKpis {
  let carsOnSite = 0;
  let waitingParts = 0;
  let awaitingApprovalCount = 0;
  let awaitingApprovalPipelinePence = 0;
  let readyForCollection = 0;

  for (const job of jobs) {
    if (CARS_ON_SITE_STATUSES.includes(job.status)) {
      carsOnSite += 1;
    }
    if (job.status === "awaiting_parts") {
      waitingParts += 1;
    }
    if (job.status === "ready_for_collection") {
      readyForCollection += 1;
    }
    if (
      job.approvedQuotePence == null &&
      job.estimatedValuePence != null
    ) {
      awaitingApprovalCount += 1;
      awaitingApprovalPipelinePence += job.estimatedValuePence;
    }
  }

  const completed = computeCompletedJobKpis(jobs);

  return {
    carsOnSite,
    waitingParts,
    awaitingApprovalCount,
    awaitingApprovalPipelinePence,
    readyForCollection,
    collectedToday: completed.collectedToday,
    completedRevenuePence: completed.completedRevenuePence,
  };
}
