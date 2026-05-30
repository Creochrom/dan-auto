import type { Job, JobStatus } from "@/lib/types/job";

const INACTIVE_REVENUE_STATUSES: readonly JobStatus[] = ["collected", "cancelled"];

export function isActiveRevenueJob(status: JobStatus): boolean {
  return !INACTIVE_REVENUE_STATUSES.includes(status);
}

/** Display/store helper: pounds string → pence (null = cleared field). */
export function parseGbpInputToPence(input: string): number | null | undefined {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[£,\s]/g, "");
  if (!normalized) return null;
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 100);
}

export function formatPenceForInput(pence?: number | null): string {
  if (pence == null || !Number.isFinite(pence)) return "";
  return (pence / 100).toFixed(pence % 100 === 0 ? 0 : 2);
}

export function formatPenceDisplay(pence?: number | null): string {
  if (pence == null || !Number.isFinite(pence)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function normalizeRevenuePence(
  value: unknown
): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 0) return undefined;
  return rounded;
}
