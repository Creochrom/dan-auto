import type { MotHistoryVehicle } from "@/lib/integrations/dvsa-mot";

/** Cached DVSA MOT History payload stored in `vehicle_mot_history`. */
export type VehicleMotHistoryRecord = {
  registration: string;
  payload: MotHistoryVehicle;
  fetchedAt: string;
  source: "dvsa";
};

export type MotHistoryFetchSource = "dvsa" | "cache" | "unavailable";

export type MotHistoryFetchResult = {
  data: MotHistoryVehicle | null;
  source: MotHistoryFetchSource;
  fetchedAt?: string;
  cached?: boolean;
};
