/**
 * Vehicle history — jobs, bookings, leads, and memory for one registration.
 */

import { stripPlate } from "@/lib/format-plate";
import { bookingService } from "@/lib/services/booking.service";
import { jobService } from "@/lib/services/job.service";
import { leadService } from "@/lib/services/lead.service";
import { vehicleTimelineService } from "@/lib/services/vehicle-timeline.service";
import { vehiclesService } from "@/lib/services/vehicles.service";
import { vehicleMemoryService } from "@/lib/services/vehicle-memory.service";
import type { Booking } from "@/lib/types/booking";
import type { Job } from "@/lib/types/job";
import type { Lead } from "@/lib/types/lead";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";
import type { VehicleTimelineEvent } from "@/lib/types/workshop-data";
import {
  buildVehicleTimelineDisplay,
  type VehicleTimelineDisplayItem,
} from "@/lib/vehicle/build-vehicle-timeline-display";

export type VehicleHistory = {
  registration: string;
  jobs: Job[];
  bookings: Booking[];
  leads: Lead[];
  timeline: VehicleTimelineEvent[];
  /** Merged MOT + jobs + bookings + intakes for UI and AI. */
  displayTimeline: VehicleTimelineDisplayItem[];
  memory: VehicleMemoryLookupResult | null;
};

function matchesReg(value: string | undefined, canon: string): boolean {
  if (!value?.trim()) return false;
  return stripPlate(value) === canon;
}

export const vehicleHistoryService = {
  async getByRegistration(registration: string): Promise<VehicleHistory | null> {
    const canon = stripPlate(registration);
    if (!canon) return null;

    const display = registration.trim().toUpperCase();

    const [jobs, allBookings, allLeads, memory, vehicle] = await Promise.all([
      jobService.listByRegistration(display),
      bookingService.list(),
      leadService.list(),
      vehicleMemoryService.lookup(canon).catch(() => null),
      vehiclesService.findByRegistration(canon).catch(() => undefined),
    ]);

    const bookings = allBookings.filter((b) => matchesReg(b.registration, canon));
    const leads = allLeads.filter((l) => matchesReg(l.registration, canon));
    const timeline = vehicle
      ? await vehicleTimelineService.listByVehicleId(vehicle.id).catch(() => [])
      : [];

    const displayTimeline = buildVehicleTimelineDisplay({
      timeline,
      jobs,
      bookings,
      memory,
    });

    return {
      registration: display,
      jobs,
      bookings,
      leads,
      timeline,
      displayTimeline,
      memory,
    };
  },
};
