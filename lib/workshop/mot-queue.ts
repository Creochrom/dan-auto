import { formatPlate } from "@/lib/format-plate";
import type { VehicleMemoryRecord } from "@/lib/types/vehicle-memory";

export const MOT_QUEUE_BUCKETS = [30, 14, 7] as const;
export type MotQueueBucket = (typeof MOT_QUEUE_BUCKETS)[number];

export type MotQueueItem = {
  reg: string;
  regDisplay: string;
  makeModel?: string;
  dueDateIso: string;
  dueDateLabel: string;
  daysToExpiry: number;
  customerName?: string;
  customerPhone?: string;
};

export type MotQueueByBucket = Record<MotQueueBucket, MotQueueItem[]> & {
  overdue: MotQueueItem[];
};

function parseIsoDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(target: Date, from: Date): number {
  const ms = startOfDay(target).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

function makeModelLabel(vehicle: VehicleMemoryRecord["vehicle"]): string | undefined {
  const label = [vehicle.make, vehicle.model].filter(Boolean).join(" ").trim();
  return label.length > 0 ? label : undefined;
}

export function buildMotQueue(
  records: VehicleMemoryRecord[],
  now = new Date()
): MotQueueByBucket {
  const buckets: MotQueueByBucket = {
    overdue: [],
    30: [],
    14: [],
    7: [],
  };

  for (const record of records) {
    const due = parseIsoDate(record.vehicle.motExpiryDate);
    if (!due) continue;
    const days = daysUntil(due, now);

    const item: MotQueueItem = {
      reg: record.reg,
      regDisplay: record.regDisplay || formatPlate(record.reg),
      makeModel: makeModelLabel(record.vehicle),
      dueDateIso: due.toISOString().slice(0, 10),
      dueDateLabel: due.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      daysToExpiry: days,
      customerName: record.customer.name || undefined,
      customerPhone: record.customer.phone || undefined,
    };

    if (days < 0) {
      buckets.overdue.push(item);
      continue;
    }

    let bucket: MotQueueBucket | null = null;
    if (days <= 7) bucket = 7;
    else if (days <= 14) bucket = 14;
    else if (days <= 30) bucket = 30;
    if (!bucket) continue;

    buckets[bucket].push(item);
  }

  buckets.overdue.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  for (const bucket of MOT_QUEUE_BUCKETS) {
    buckets[bucket].sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }

  return buckets;
}
