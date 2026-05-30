/**
 * Indicative workshop revenue pipeline — operational visibility, not accounting.
 */

import type { Job } from "@/lib/types/job";
import { isActiveRevenueJob } from "@/lib/workshop/job-revenue";

export type ParsedRangePence = {
  minPence: number;
  maxPence: number;
  midPence: number;
};

export type RevenuePipeline = {
  potentialPence: number;
  confirmedPence: number;
  completedPence: number;
  awaitingQuoteCount: number;
  awaitingQuotePence: number;
};

export function parseEstimatedRangePence(input?: string | null): ParsedRangePence | null {
  if (!input?.trim()) return null;
  const normalized = input.replace(/,/g, "").trim();
  const matches = normalized.match(/(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length === 0) return null;

  const values = matches
    .map((v) => Math.round(Number.parseFloat(v) * 100))
    .filter((p) => Number.isFinite(p) && p > 0);

  if (values.length === 0) return null;

  const minPence = Math.min(...values);
  const maxPence = Math.max(...values);
  const midPence = Math.round((minPence + maxPence) / 2);
  return { minPence, maxPence, midPence };
}

export function formatPipelineGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function computeRevenuePipeline(input: { jobs: Job[] }): RevenuePipeline {
  const { jobs } = input;

  let potentialPence = 0;
  let confirmedPence = 0;
  let completedPence = 0;
  let awaitingQuoteCount = 0;
  let awaitingQuotePence = 0;

  for (const job of jobs) {
    const estimate = job.estimatedValuePence ?? 0;
    const approved = job.approvedQuotePence ?? 0;
    const finalInvoice = job.finalInvoicePence ?? 0;

    if (isActiveRevenueJob(job.status) && job.estimatedValuePence != null) {
      potentialPence += job.estimatedValuePence;
    }

    if (job.approvedQuotePence != null) {
      confirmedPence += job.approvedQuotePence;
    }

    if (job.finalInvoicePence != null) {
      completedPence += job.finalInvoicePence;
    }

    if (
      isActiveRevenueJob(job.status) &&
      job.approvedQuotePence == null
    ) {
      awaitingQuoteCount += 1;
      if (job.estimatedValuePence != null) {
        awaitingQuotePence += job.estimatedValuePence;
      }
    }
  }

  return {
    potentialPence,
    confirmedPence,
    completedPence,
    awaitingQuoteCount,
    awaitingQuotePence,
  };
}
