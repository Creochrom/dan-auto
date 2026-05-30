/**
 * Unified workshop vehicle queue — merges bookings + jobs into one mechanic-first list.
 */

import type { Booking, BookingStatus } from "@/lib/types/booking";
import type { Job, JobStatus } from "@/lib/types/job";
import { JOB_STATUS_LABELS } from "@/lib/types/job";

export type WorkQueueItemKind = "booking" | "job";

export type WorkQueuePriority =
  | "waiting_customer"
  | "waiting_parts"
  | "ready_for_collection"
  | "today_arrival"
  | "default";

export type WorkQueueFilter =
  | "all"
  | "on_ramp"
  | "waiting_customer"
  | "waiting_parts"
  | "ready";

export type WorkQueueItem = {
  id: string;
  kind: WorkQueueItemKind;
  registration: string;
  vehicleLabel?: string;
  customerName: string;
  customerPhone: string;
  service: string;
  scheduledAt: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: string;
  statusLabel: string;
  priority: WorkQueuePriority;
  bookingId?: string;
  jobId?: string;
  updatedAt: string;
  estimatedValuePence?: number | null;
  approvedQuotePence?: number | null;
  finalInvoicePence?: number | null;
};

const QUEUE_BOOKING_STATUSES: readonly BookingStatus[] = [
  "new",
  "awaiting_callback",
  "confirmed",
];

const QUEUE_JOB_STATUSES: readonly JobStatus[] = [
  "booked",
  "checked_in",
  "diagnosing",
  "awaiting_approval",
  "awaiting_parts",
  "in_progress",
  "quality_check",
  "ready_for_collection",
];

const ON_RAMP_JOB_STATUSES: readonly JobStatus[] = [
  "booked",
  "checked_in",
  "diagnosing",
  "in_progress",
  "quality_check",
];

export function todayIsoDate(reference = new Date()): string {
  return reference.toISOString().slice(0, 10);
}

function bookingStatusLabel(status: BookingStatus): string {
  return status.replaceAll("_", " ");
}

function jobPriority(status: JobStatus, scheduledDate: string, today: string): WorkQueuePriority {
  if (status === "awaiting_approval") return "waiting_customer";
  if (status === "awaiting_parts") return "waiting_parts";
  if (status === "ready_for_collection") return "ready_for_collection";
  if (scheduledDate.startsWith(today)) return "today_arrival";
  return "default";
}

function bookingPriority(status: BookingStatus, preferredDate: string, today: string): WorkQueuePriority {
  if (status === "awaiting_callback") return "waiting_customer";
  if (preferredDate.startsWith(today)) return "today_arrival";
  return "default";
}

const PRIORITY_ORDER: Record<WorkQueuePriority, number> = {
  waiting_customer: 0,
  waiting_parts: 1,
  ready_for_collection: 2,
  today_arrival: 3,
  default: 4,
};

function jobToItem(job: Job, today: string): WorkQueueItem {
  return {
    id: job.id,
    kind: "job",
    registration: job.registration,
    vehicleLabel: job.vehicle
      ? [job.vehicle.registration, job.service].join(" · ")
      : undefined,
    customerName: job.customerName,
    customerPhone: job.customerPhone,
    service: job.service,
    scheduledAt: job.scheduledDate,
    scheduledDate: job.scheduledDate,
    status: job.status,
    statusLabel: JOB_STATUS_LABELS[job.status] ?? job.status,
    priority: jobPriority(job.status, job.scheduledDate, today),
    bookingId: job.bookingId,
    jobId: job.id,
    updatedAt: job.updatedAt,
    estimatedValuePence: job.estimatedValuePence,
    approvedQuotePence: job.approvedQuotePence,
    finalInvoicePence: job.finalInvoicePence,
  };
}

function bookingToItem(booking: Booking, today: string): WorkQueueItem {
  return {
    id: booking.id,
    kind: "booking",
    registration: booking.registration,
    vehicleLabel: booking.vehicleModel,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    service: booking.service,
    scheduledAt: `${booking.preferredDate} · ${booking.preferredTime}`,
    scheduledDate: booking.preferredDate,
    scheduledTime: booking.preferredTime,
    status: booking.status,
    statusLabel: bookingStatusLabel(booking.status),
    priority: bookingPriority(booking.status, booking.preferredDate, today),
    bookingId: booking.id,
    updatedAt: booking.updatedAt,
  };
}

export function buildWorkQueue(
  bookings: Booking[],
  jobs: Job[],
  referenceDate = new Date()
): WorkQueueItem[] {
  const today = todayIsoDate(referenceDate);
  const linkedBookingIds = new Set(
    jobs.map((j) => j.bookingId).filter((id): id is string => Boolean(id))
  );

  const items: WorkQueueItem[] = [];

  for (const job of jobs) {
    if (!QUEUE_JOB_STATUSES.includes(job.status)) continue;
    items.push(jobToItem(job, today));
  }

  for (const booking of bookings) {
    if (!QUEUE_BOOKING_STATUSES.includes(booking.status)) continue;
    if (linkedBookingIds.has(booking.id)) continue;
    items.push(bookingToItem(booking, today));
  }

  return sortWorkQueue(items);
}

export function sortWorkQueue(items: WorkQueueItem[]): WorkQueueItem[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority];
    const pb = PRIORITY_ORDER[b.priority];
    if (pa !== pb) return pa - pb;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function filterWorkQueue(
  items: WorkQueueItem[],
  filter: WorkQueueFilter
): WorkQueueItem[] {
  if (filter === "all") return items;

  return items.filter((item) => {
    switch (filter) {
      case "waiting_customer":
        return (
          item.status === "awaiting_approval" ||
          item.status === "awaiting_callback"
        );
      case "waiting_parts":
        return item.status === "awaiting_parts";
      case "ready":
        return item.status === "ready_for_collection";
      case "on_ramp":
        if (item.kind === "job") {
          return ON_RAMP_JOB_STATUSES.includes(item.status as JobStatus);
        }
        return (
          item.status === "new" ||
          item.status === "confirmed" ||
          item.status === "awaiting_callback"
        );
      default:
        return true;
    }
  });
}

export type TodayMetrics = {
  bookingsToday: number;
  jobsInProgress: number;
  waitingCustomer: number;
  waitingParts: number;
  readyCollection: number;
};

export function countWorkQueueByFilter(items: WorkQueueItem[]): Record<WorkQueueFilter, number> {
  return {
    all: items.length,
    on_ramp: filterWorkQueue(items, "on_ramp").length,
    waiting_customer: filterWorkQueue(items, "waiting_customer").length,
    waiting_parts: filterWorkQueue(items, "waiting_parts").length,
    ready: filterWorkQueue(items, "ready").length,
  };
}

export function computeTodayMetrics(
  bookings: Booking[],
  jobs: Job[],
  referenceDate = new Date()
): TodayMetrics {
  const today = todayIsoDate(referenceDate);
  const queue = buildWorkQueue(bookings, jobs, referenceDate);

  const bookingsToday = bookings.filter(
    (b) =>
      b.preferredDate.startsWith(today) &&
      (b.status === "new" ||
        b.status === "awaiting_callback" ||
        b.status === "confirmed" ||
        b.status === "in_progress")
  ).length;

  const jobsInProgress = jobs.filter((j) => j.status === "in_progress").length;

  const waitingCustomer = queue.filter(
    (i) =>
      i.status === "awaiting_approval" || i.status === "awaiting_callback"
  ).length;

  const waitingParts = queue.filter((i) => i.status === "awaiting_parts").length;

  const readyCollection = queue.filter(
    (i) => i.status === "ready_for_collection"
  ).length;

  return {
    bookingsToday,
    jobsInProgress,
    waitingCustomer,
    waitingParts,
    readyCollection,
  };
}
