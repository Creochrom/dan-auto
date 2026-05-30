/**
 * Completed / collected job helpers — jobs must remain discoverable after collection.
 */

import type { Job, JobStatus } from "@/lib/types/job";
import { todayIsoDate } from "@/lib/workshop/work-queue";

export function isCollectedJob(status: JobStatus): boolean {
  return status === "collected";
}

export function isCompletedJobStatus(status: JobStatus): boolean {
  return status === "collected" || status === "cancelled";
}

export function wasUpdatedOnDate(iso: string, dateIso: string): boolean {
  return iso.slice(0, 10) === dateIso;
}

export type CompletedJobFilters = {
  /** Only jobs whose updatedAt falls on the reference calendar day. */
  updatedToday?: boolean;
  referenceDate?: Date;
};

export function filterCollectedJobs(
  jobs: Job[],
  filters: CompletedJobFilters = {}
): Job[] {
  const today = todayIsoDate(filters.referenceDate ?? new Date());
  return jobs
    .filter((job) => {
      if (!isCollectedJob(job.status)) return false;
      if (filters.updatedToday && !wasUpdatedOnDate(job.updatedAt, today)) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export type CompletedJobKpis = {
  collectedToday: number;
  collectedTotal: number;
  completedRevenuePence: number;
  collectedTodayRevenuePence: number;
};

export function computeCompletedJobKpis(
  jobs: Job[],
  referenceDate = new Date()
): CompletedJobKpis {
  const today = todayIsoDate(referenceDate);
  let collectedToday = 0;
  let collectedTotal = 0;
  let completedRevenuePence = 0;
  let collectedTodayRevenuePence = 0;

  for (const job of jobs) {
    if (!isCollectedJob(job.status)) continue;
    collectedTotal += 1;
    const invoice = job.finalInvoicePence ?? job.approvedQuotePence ?? 0;
    completedRevenuePence += invoice;
    if (wasUpdatedOnDate(job.updatedAt, today)) {
      collectedToday += 1;
      collectedTodayRevenuePence += invoice;
    }
  }

  return {
    collectedToday,
    collectedTotal,
    completedRevenuePence,
    collectedTodayRevenuePence,
  };
}
