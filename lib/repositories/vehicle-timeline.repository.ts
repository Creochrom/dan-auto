import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseVehicleTimelineRepository } from "@/lib/repositories/supabase/vehicle-timeline.repository";
import type {
  CreateVehicleTimelineEventInput,
  VehicleTimelineEvent,
} from "@/lib/types/workshop-data";

const mockVehicleTimeline = new Map<string, VehicleTimelineEvent[]>();
const mockVehicleTimelineBySourceRef = new Map<string, VehicleTimelineEvent>();

function newId() {
  return `vte_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const vehicleTimelineRepository = {
  async listByVehicleId(vehicleId: string): Promise<VehicleTimelineEvent[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehicleTimelineRepository.listByVehicleId(vehicleId);
    }
    return (mockVehicleTimeline.get(vehicleId) ?? [])
      .slice()
      .sort((a, b) => b.eventAt.localeCompare(a.eventAt));
  },

  async addEvent(input: CreateVehicleTimelineEventInput): Promise<VehicleTimelineEvent> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehicleTimelineRepository.addEvent(input);
    }
    const event: VehicleTimelineEvent = {
      id: newId(),
      vehicleId: input.vehicleId,
      eventType: input.eventType,
      source: input.source ?? "system",
      sourceRef: input.sourceRef,
      title: input.title,
      description: input.description,
      eventAt: input.eventAt ?? new Date().toISOString(),
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };
    const list = mockVehicleTimeline.get(input.vehicleId) ?? [];
    mockVehicleTimeline.set(input.vehicleId, [...list, event]);
    if (event.sourceRef) mockVehicleTimelineBySourceRef.set(event.sourceRef, event);
    return event;
  },

  async upsertEventBySourceRef(input: CreateVehicleTimelineEventInput): Promise<VehicleTimelineEvent> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehicleTimelineRepository.upsertEventBySourceRef(input);
    }
    if (!input.sourceRef) {
      return this.addEvent(input);
    }
    const existing = mockVehicleTimelineBySourceRef.get(input.sourceRef);
    if (!existing) {
      return this.addEvent(input);
    }
    const updated: VehicleTimelineEvent = {
      ...existing,
      vehicleId: input.vehicleId,
      eventType: input.eventType,
      source: input.source ?? existing.source,
      title: input.title,
      description: input.description,
      eventAt: input.eventAt ?? existing.eventAt,
      metadata: input.metadata ?? existing.metadata,
    };
    const list = mockVehicleTimeline.get(existing.vehicleId) ?? [];
    const nextList = list.map((event) => (event.id === existing.id ? updated : event));
    mockVehicleTimeline.set(existing.vehicleId, nextList);
    mockVehicleTimelineBySourceRef.set(input.sourceRef, updated);
    return updated;
  },
};
