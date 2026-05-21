import type { VehicleLookupResponse } from "@/lib/types/vehicle-report";
import { buildVehicleReport } from "@/lib/vehicle-report-builder";
import { stripPlate } from "@/lib/format-plate";

const cache = new Map<string, { at: number; payload: VehicleLookupResponse }>();
const CACHE_TTL_MS = 1000 * 60 * 15;

export function lookupVehicle(reg: string): VehicleLookupResponse {
  const canon = stripPlate(reg);
  if (canon.length < 2) {
    throw new Error("Invalid registration");
  }

  const cached = cache.get(canon);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.payload, cached: true };
  }

  const report = buildVehicleReport(canon);
  const payload: VehicleLookupResponse = {
    reg: report.reg,
    matched: report.matched,
    report,
  };

  cache.set(canon, { at: Date.now(), payload });
  return payload;
}
