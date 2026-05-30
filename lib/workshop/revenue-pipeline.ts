/**
 * Indicative workshop revenue pipeline — operational visibility, not accounting.
 */

import type { Booking, BookingStatus } from "@/lib/types/booking";
import type { Job, JobStatus } from "@/lib/types/job";
import type { Invoice } from "@/lib/types/workshop-data";

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

const BOOKING_POTENTIAL: readonly BookingStatus[] = ["new", "awaiting_callback"];

const JOB_CONFIRMED: readonly JobStatus[] = [
  "booked",
  "checked_in",
  "diagnosing",
  "awaiting_approval",
  "awaiting_parts",
  "in_progress",
  "quality_check",
  "ready_for_collection",
];

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

function invoiceTotalPence(invoice?: Invoice | null): number | null {
  if (!invoice?.totalPence || !Number.isFinite(invoice.totalPence)) return null;
  return invoice.totalPence;
}

function estimatePenceFromBooking(booking?: Booking | null): number {
  const parsed = parseEstimatedRangePence(booking?.intakeSummary?.estimatedRange);
  return parsed?.midPence ?? 0;
}

function valueForJob(
  job: Job,
  bookingById: Map<string, Booking>,
  invoiceByJobId: Map<string, Invoice | null>
): number {
  const invoice = invoiceTotalPence(invoiceByJobId.get(job.id));
  if (invoice != null) return invoice;
  if (job.bookingId) {
    return estimatePenceFromBooking(bookingById.get(job.bookingId));
  }
  return 0;
}

export function computeRevenuePipeline(input: {
  bookings: Booking[];
  jobs: Job[];
  invoiceByJobId: Map<string, Invoice | null>;
}): RevenuePipeline {
  const { bookings, jobs, invoiceByJobId } = input;
  const bookingById = new Map(bookings.map((b) => [b.id, b]));
  const linkedBookingIds = new Set(
    jobs.map((j) => j.bookingId).filter((id): id is string => Boolean(id))
  );

  let potentialPence = 0;
  for (const booking of bookings) {
    if (!BOOKING_POTENTIAL.includes(booking.status)) continue;
    if (linkedBookingIds.has(booking.id)) continue;
    potentialPence += estimatePenceFromBooking(booking);
  }

  let confirmedPence = 0;
  for (const booking of bookings) {
    if (booking.status !== "confirmed") continue;
    if (linkedBookingIds.has(booking.id)) continue;
    confirmedPence += estimatePenceFromBooking(booking);
  }
  for (const job of jobs) {
    if (!JOB_CONFIRMED.includes(job.status)) continue;
    confirmedPence += valueForJob(job, bookingById, invoiceByJobId);
  }

  let completedPence = 0;
  for (const job of jobs) {
    if (job.status !== "collected") continue;
    completedPence += valueForJob(job, bookingById, invoiceByJobId);
  }

  let awaitingQuoteCount = 0;
  let awaitingQuotePence = 0;
  for (const job of jobs) {
    if (job.status !== "awaiting_approval") continue;
    const hasInvoice = invoiceTotalPence(invoiceByJobId.get(job.id)) != null;
    if (hasInvoice) continue;
    awaitingQuoteCount += 1;
    awaitingQuotePence += valueForJob(job, bookingById, invoiceByJobId);
  }

  return {
    potentialPence,
    confirmedPence,
    completedPence,
    awaitingQuoteCount,
    awaitingQuotePence,
  };
}
