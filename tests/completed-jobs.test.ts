import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCompletedJobKpis,
  filterCollectedJobs,
  isCollectedJob,
} from "../lib/workshop/completed-jobs.ts";
import { resolveJobsFromResponse } from "../lib/workshop/resolve-jobs-response.ts";
import { computeTodayOperationalKpis } from "../lib/workshop/today-operational-kpis.ts";
import type { Job } from "../lib/types/job.ts";

function job(partial: Partial<Job> & Pick<Job, "id" | "status">): Job {
  return {
    registration: "AB12 CDE",
    customerName: "Test",
    customerPhone: "07000000000",
    service: "Service",
    scheduledDate: "2026-05-28",
    createdAt: "2026-05-28T08:00:00.000Z",
    updatedAt: "2026-05-28T10:00:00.000Z",
    ...partial,
  };
}

describe("completed jobs visibility", () => {
  it("isCollectedJob identifies collected status only", () => {
    assert.equal(isCollectedJob("collected"), true);
    assert.equal(isCollectedJob("ready_for_collection"), false);
    assert.equal(isCollectedJob("cancelled"), false);
  });

  it("filterCollectedJobs returns today collected jobs sorted by updatedAt", () => {
    const today = "2026-05-28T12:00:00.000Z";
    const jobs = [
      job({
        id: "old",
        status: "collected",
        updatedAt: "2026-05-27T12:00:00.000Z",
      }),
      job({
        id: "today-a",
        status: "collected",
        updatedAt: "2026-05-28T09:00:00.000Z",
      }),
      job({
        id: "today-b",
        status: "collected",
        updatedAt: "2026-05-28T11:00:00.000Z",
      }),
      job({ id: "active", status: "in_progress" }),
    ];

    const todayCollected = filterCollectedJobs(jobs, {
      updatedToday: true,
      referenceDate: new Date(today),
    });
    assert.equal(todayCollected.length, 2);
    assert.equal(todayCollected[0]!.id, "today-b");
  });

  it("computeCompletedJobKpis sums final invoice revenue", () => {
    const kpis = computeCompletedJobKpis([
      job({
        id: "c1",
        status: "collected",
        finalInvoicePence: 12000,
        updatedAt: "2026-05-28T10:00:00.000Z",
      }),
      job({
        id: "c2",
        status: "collected",
        approvedQuotePence: 8000,
        updatedAt: "2026-05-27T10:00:00.000Z",
      }),
    ], new Date("2026-05-28T12:00:00.000Z"));

    assert.equal(kpis.collectedToday, 1);
    assert.equal(kpis.collectedTotal, 2);
    assert.equal(kpis.completedRevenuePence, 20000);
    assert.equal(kpis.collectedTodayRevenuePence, 12000);
  });

  it("computeTodayOperationalKpis includes collectedToday", () => {
    const todayIso = new Date().toISOString();
    const kpis = computeTodayOperationalKpis([
      job({ id: "a", status: "in_progress" }),
      job({
        id: "b",
        status: "collected",
        finalInvoicePence: 5000,
        updatedAt: todayIso,
      }),
    ]);
    assert.equal(kpis.collectedToday, 1);
    assert.equal(kpis.completedRevenuePence, 5000);
  });
});

describe("resolveJobsFromResponse", () => {
  it("accepts nested jobs array from API", () => {
    const rows = resolveJobsFromResponse({
      ok: true,
      data: { jobs: [job({ id: "j1", status: "booked" })] },
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.id, "j1");
  });
});
