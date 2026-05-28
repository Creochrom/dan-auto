import { vehicleTimelineRepository } from "@/lib/repositories/vehicle-timeline.repository";
import type {
  CreateVehicleTimelineEventInput,
  VehicleTimelineEvent,
} from "@/lib/types/workshop-data";

export const vehicleTimelineService = {
  listByVehicleId(vehicleId: string): Promise<VehicleTimelineEvent[]> {
    return vehicleTimelineRepository.listByVehicleId(vehicleId);
  },

  addEvent(input: CreateVehicleTimelineEventInput): Promise<VehicleTimelineEvent> {
    return vehicleTimelineRepository.addEvent(input);
  },

  upsertEventBySourceRef(input: CreateVehicleTimelineEventInput): Promise<VehicleTimelineEvent> {
    return vehicleTimelineRepository.upsertEventBySourceRef(input);
  },
};
