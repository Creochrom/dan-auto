import type { VehicleLookupResponse } from "@/lib/types/vehicle-report";
import { stripPlate } from "@/lib/format-plate";
import { fetchVehicleDetails } from "@/lib/services/dvla/dvla.service";
import { normalizeDvlaVehicle } from "@/lib/services/dvla/dvla.normalizer";
import { DvlaServiceError } from "@/lib/services/dvla/dvla.types";
import { buildVehicleReportFromDvla } from "@/lib/vehicle-report-from-dvla";

const cache = new Map<string, { at: number; payload: VehicleLookupResponse }>();
const CACHE_TTL_MS = 1000 * 60 * 15;

export async function lookupVehicle(reg: string): Promise<VehicleLookupResponse> {
  const canon = stripPlate(reg);
  if (canon.length < 2) {
    console.warn("[vehicle-lookup] invalid registration", reg);
    throw new Error("Invalid registration");
  }

  const cached = cache.get(canon);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.payload, cached: true };
  }

  try {
    const raw = await fetchVehicleDetails(canon);
    const normalized = normalizeDvlaVehicle(raw, canon);
    const report = buildVehicleReportFromDvla(canon, normalized);
    const payload: VehicleLookupResponse = {
      reg: report.reg,
      matched: true,
      report,
    };

    cache.set(canon, { at: Date.now(), payload });
    return payload;
  } catch (err) {
    if (err instanceof DvlaServiceError) {
      throw err;
    }
    console.error("[vehicle-lookup] unexpected failure", canon, err);
    throw new Error("Vehicle lookup failed");
  }
}
