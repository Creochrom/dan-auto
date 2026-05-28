import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateVehicleTimelineEventInput,
  VehicleTimelineEvent,
  VehicleTimelineEventType,
} from "@/lib/types/workshop-data";

type VehicleTimelineRow = {
  id: string;
  vehicle_id: string;
  event_type: VehicleTimelineEventType;
  source: string;
  source_ref: string | null;
  title: string;
  description: string | null;
  event_at: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function toVehicleTimelineEvent(row: VehicleTimelineRow): VehicleTimelineEvent {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    eventType: row.event_type,
    source: row.source,
    sourceRef: row.source_ref ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    eventAt: row.event_at,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

function newId() {
  return `vte_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseVehicleTimelineRepository = {
  async listByVehicleId(vehicleId: string): Promise<VehicleTimelineEvent[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("vehicle_timeline_events")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("event_at", { ascending: false });
    if (error) throw new Error(`[vehicle_timeline] listByVehicleId failed: ${error.message}`);
    return (data as VehicleTimelineRow[]).map(toVehicleTimelineEvent);
  },

  async addEvent(input: CreateVehicleTimelineEventInput): Promise<VehicleTimelineEvent> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      vehicle_id: input.vehicleId,
      event_type: input.eventType,
      source: input.source ?? "system",
      source_ref: input.sourceRef ?? null,
      title: input.title,
      description: input.description ?? null,
      event_at: input.eventAt ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("vehicle_timeline_events")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(`[vehicle_timeline] addEvent failed: ${error.message}`);
    return toVehicleTimelineEvent(data as VehicleTimelineRow);
  },

  async upsertEventBySourceRef(input: CreateVehicleTimelineEventInput): Promise<VehicleTimelineEvent> {
    if (!input.sourceRef) {
      return this.addEvent(input);
    }
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      vehicle_id: input.vehicleId,
      event_type: input.eventType,
      source: input.source ?? "system",
      source_ref: input.sourceRef,
      title: input.title,
      description: input.description ?? null,
      event_at: input.eventAt ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("vehicle_timeline_events")
      .upsert(row, { onConflict: "source_ref" })
      .select("*")
      .single();
    if (error) throw new Error(`[vehicle_timeline] upsertEventBySourceRef failed: ${error.message}`);
    return toVehicleTimelineEvent(data as VehicleTimelineRow);
  },
};
