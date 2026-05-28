import type { Booking } from "@/lib/types/booking";
import type { Job } from "@/lib/types/job";
import type { VehicleTimelineEvent } from "@/lib/types/workshop-data";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";

export type VehicleTimelineDisplayCategory =
  | "mot"
  | "repair"
  | "job"
  | "booking"
  | "intake"
  | "system";

export type VehicleTimelineDisplayItem = {
  id: string;
  at: string;
  year: number;
  category: VehicleTimelineDisplayCategory;
  title: string;
  description?: string;
  href?: string;
};

function yearFromIso(iso: string): number {
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

function categoryFromJob(service: string): VehicleTimelineDisplayCategory {
  const s = service.toLowerCase();
  if (/mot\b/.test(s)) return "mot";
  if (/brake|pad|disc|suspension|tyre|tire|oil|service|diagnostic/.test(s)) {
    return "repair";
  }
  return "job";
}

export function buildVehicleTimelineDisplay(input: {
  timeline: VehicleTimelineEvent[];
  jobs: Job[];
  bookings: Booking[];
  memory: VehicleMemoryLookupResult | null;
}): VehicleTimelineDisplayItem[] {
  const items: VehicleTimelineDisplayItem[] = [];

  for (const event of input.timeline) {
    const category: VehicleTimelineDisplayCategory =
      event.eventType === "mot_test"
        ? "mot"
        : event.eventType === "job_status_change"
          ? "job"
          : "system";

    items.push({
      id: event.id,
      at: event.eventAt,
      year: yearFromIso(event.eventAt),
      category,
      title: event.title,
      description: event.description,
    });
  }

  for (const job of input.jobs) {
    const at = job.updatedAt || job.createdAt;
    const cat = categoryFromJob(job.service);
    items.push({
      id: `job-${job.id}`,
      at,
      year: yearFromIso(at),
      category: cat,
      title: `${yearFromIso(at)} · ${job.service}`,
      description: job.symptomsText?.trim() || `Status: ${job.status.replaceAll("_", " ")}`,
      href: `/admin/jobs/${job.id}`,
    });
  }

  for (const booking of input.bookings) {
    const at = booking.createdAt;
    items.push({
      id: `booking-${booking.id}`,
      at,
      year: yearFromIso(at),
      category: "booking",
      title: `${yearFromIso(at)} · Booking · ${booking.service}`,
      description: booking.notes?.trim() || booking.status.replaceAll("_", " "),
      href: `/admin/bookings/${booking.id}`,
    });
  }

  const memory = input.memory;
  if (memory?.recentIntakes?.length) {
    for (const intake of memory.recentIntakes.slice(0, 8)) {
      items.push({
        id: `intake-${intake.at}`,
        at: intake.at,
        year: yearFromIso(intake.at),
        category: "intake",
        title: `${yearFromIso(intake.at)} · Customer intake`,
        description:
          intake.summary ||
          (intake.symptoms.length ? intake.symptoms.join("; ") : undefined),
      });
    }
  }

  if (memory?.vehicle?.motExpiryDate) {
    items.push({
      id: `mot-expiry-${memory.vehicle.motExpiryDate}`,
      at: memory.vehicle.motExpiryDate,
      year: yearFromIso(memory.vehicle.motExpiryDate),
      category: "mot",
      title: `MOT expires ${memory.vehicle.motExpiryDate}`,
      description: memory.vehicle.motStatus
        ? `Status: ${memory.vehicle.motStatus}`
        : undefined,
    });
  }

  const seen = new Set<string>();
  const deduped: VehicleTimelineDisplayItem[] = [];
  for (const item of items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )) {
    const key = `${item.category}|${item.title}|${item.at.slice(0, 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

/** Plain-text block for Workshop AI grounding. */
export function formatVehicleTimelineForAi(items: VehicleTimelineDisplayItem[]): string {
  if (!items.length) return "";
  return items
    .slice(0, 16)
    .map((item) => {
      const line = `${item.year} · ${item.title}`;
      return item.description ? `${line} — ${item.description}` : line;
    })
    .join("\n");
}
