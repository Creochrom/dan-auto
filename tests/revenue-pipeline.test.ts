import assert from "node:assert/strict";
import test from "node:test";
import type { Job } from "@/lib/types/job";
import { computeRevenuePipeline } from "@/lib/workshop/revenue-pipeline";
import {
  formatPenceForInput,
  parseGbpInputToPence,
} from "@/lib/workshop/job-revenue";

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

test("computeRevenuePipeline sums job revenue fields", () => {
  const pipeline = computeRevenuePipeline({
    jobs: [
      job({
        id: "j1",
        status: "in_progress",
        estimatedValuePence: 15000,
        approvedQuotePence: 18000,
      }),
      job({
        id: "j2",
        status: "collected",
        estimatedValuePence: 9000,
        approvedQuotePence: 10000,
        finalInvoicePence: 10500,
      }),
      job({
        id: "j3",
        status: "awaiting_approval",
        estimatedValuePence: 5000,
      }),
    ],
  });

  assert.equal(pipeline.potentialPence, 20000);
  assert.equal(pipeline.confirmedPence, 28000);
  assert.equal(pipeline.completedPence, 10500);
  assert.equal(pipeline.awaitingQuoteCount, 1);
  assert.equal(pipeline.awaitingQuotePence, 5000);
});

test("parseGbpInputToPence handles pounds input", () => {
  assert.equal(parseGbpInputToPence("150"), 15000);
  assert.equal(parseGbpInputToPence("£150.50"), 15050);
  assert.equal(parseGbpInputToPence(""), null);
  assert.equal(formatPenceForInput(15000), "150");
});
