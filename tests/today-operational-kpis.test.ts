import assert from "node:assert/strict";
import test from "node:test";
import type { Job } from "@/lib/types/job";
import { computeTodayOperationalKpis } from "@/lib/workshop/today-operational-kpis";

function job(partial: Partial<Job> & Pick<Job, "id" | "status">): Job {
  return {
    id: partial.id,
    status: partial.status,
    registration: partial.registration ?? "AB12CDE",
    customerName: partial.customerName ?? "Test",
    customerPhone: partial.customerPhone ?? "07123456789",
    scheduledDate: partial.scheduledDate ?? "2026-06-01",
    service: partial.service ?? "Diagnostics",
    createdAt: partial.createdAt ?? "2026-06-01T10:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-06-01T10:00:00.000Z",
    estimatedValuePence: partial.estimatedValuePence,
    approvedQuotePence: partial.approvedQuotePence,
    finalInvoicePence: partial.finalInvoicePence,
  };
}

test("computeTodayOperationalKpis counts floor and approval pipeline", () => {
  const kpis = computeTodayOperationalKpis([
    job({ id: "j1", status: "checked_in" }),
    job({ id: "j2", status: "in_progress" }),
    job({ id: "j3", status: "awaiting_parts" }),
    job({ id: "j4", status: "ready_for_collection" }),
    job({ id: "j5", status: "booked" }),
    job({
      id: "j6",
      status: "diagnosing",
      estimatedValuePence: 12000,
      approvedQuotePence: null,
    }),
    job({
      id: "j7",
      status: "awaiting_approval",
      estimatedValuePence: 8000,
      approvedQuotePence: null,
    }),
    job({
      id: "j8",
      status: "in_progress",
      estimatedValuePence: 5000,
      approvedQuotePence: 5500,
    }),
  ]);

  assert.equal(kpis.carsOnSite, 5);
  assert.equal(kpis.waitingParts, 1);
  assert.equal(kpis.readyForCollection, 1);
  assert.equal(kpis.awaitingApprovalCount, 2);
  assert.equal(kpis.awaitingApprovalPipelinePence, 20000);
});
