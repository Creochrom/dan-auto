import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { VehicleMotHistoryRecord } from "@/lib/types/vehicle-mot-history";

type VehicleMotHistoryRow = {
  registration: string;
  payload: VehicleMotHistoryRecord["payload"];
  fetched_at: string;
  source: string;
};

function toRecord(row: VehicleMotHistoryRow): VehicleMotHistoryRecord {
  return {
    registration: row.registration,
    payload: row.payload,
    fetchedAt: row.fetched_at,
    source: "dvsa",
  };
}

export const supabaseVehicleMotHistoryRepository = {
  async findByRegistration(reg: string): Promise<VehicleMotHistoryRecord | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("vehicle_mot_history")
      .select("*")
      .eq("registration", reg)
      .maybeSingle();

    if (error) {
      throw new Error(`[vehicle_mot_history] find failed: ${error.message}`);
    }
    if (!data) return undefined;
    return toRecord(data as VehicleMotHistoryRow);
  },

  async upsert(record: VehicleMotHistoryRecord): Promise<VehicleMotHistoryRecord> {
    const supabase = getSupabaseServerClient();
    const row = {
      registration: record.registration,
      payload: record.payload,
      fetched_at: record.fetchedAt,
      source: record.source,
    };

    const { data, error } = await supabase
      .from("vehicle_mot_history")
      .upsert(row, { onConflict: "registration" })
      .select("*")
      .single();

    if (error) {
      throw new Error(`[vehicle_mot_history] upsert failed: ${error.message}`);
    }
    return toRecord(data as VehicleMotHistoryRow);
  },
};
