import { getStorageBackend } from "@/lib/repositories/backend";
import { mockStore } from "@/lib/repositories/mock-store";
import { supabaseVehicleMotHistoryRepository } from "@/lib/repositories/supabase/vehicle-mot-history.repository";
import type { MotHistoryVehicle } from "@/lib/integrations/dvsa-mot";
import type { VehicleMotHistoryRecord } from "@/lib/types/vehicle-mot-history";
import { stripPlate } from "@/lib/format-plate";

export const vehicleMotHistoryRepository = {
  async findByRegistration(reg: string): Promise<VehicleMotHistoryRecord | undefined> {
    const canon = stripPlate(reg);
    if (!canon) return undefined;

    if (getStorageBackend() === "supabase") {
      return supabaseVehicleMotHistoryRepository.findByRegistration(canon);
    }

    return mockStore.vehicleMotHistory.find((r) => r.registration === canon);
  },

  async upsert(
    reg: string,
    payload: MotHistoryVehicle
  ): Promise<VehicleMotHistoryRecord> {
    const canon = stripPlate(reg);
    const now = new Date().toISOString();
    const record: VehicleMotHistoryRecord = {
      registration: canon,
      payload,
      fetchedAt: now,
      source: "dvsa",
    };

    if (getStorageBackend() === "supabase") {
      return supabaseVehicleMotHistoryRepository.upsert(record);
    }

    const idx = mockStore.vehicleMotHistory.findIndex((r) => r.registration === canon);
    if (idx >= 0) {
      mockStore.vehicleMotHistory[idx] = record;
    } else {
      mockStore.vehicleMotHistory.push(record);
    }
    return record;
  },
};
