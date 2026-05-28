import type { VehicleLookupResponse } from "@/lib/types/vehicle-report";
import { stripPlate } from "@/lib/format-plate";
import { vehiclesService } from "@/lib/services/vehicles.service";
import { fetchVehicleDetails } from "@/lib/services/dvla/dvla.service";
import { normalizeDvlaVehicle } from "@/lib/services/dvla/dvla.normalizer";
import { DvlaServiceError } from "@/lib/services/dvla/dvla.types";
import {
  fetchMotHistory,
  type MotHistoryVehicle,
  type MotTestRecord,
} from "@/lib/services/dvla/mot-history.service";
import { vehicleTimelineService } from "@/lib/services/vehicle-timeline.service";
import { buildVehicleReportFromDvla } from "@/lib/vehicle-report-from-dvla";

const cache = new Map<string, { at: number; payload: VehicleLookupResponse }>();
const CACHE_TTL_MS = 1000 * 60 * 15;

function eventAtFromMotDate(value: string): string {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function advisoryCount(test: MotTestRecord): number {
  return (test.rfrAndComments ?? []).filter((item) =>
    ["ADVISORY", "MAJOR", "DANGEROUS", "PRS"].includes(item.type)
  ).length;
}

async function ingestMotTimelineEvents(input: {
  canonReg: string;
  motHistoryData: MotHistoryVehicle | null;
  vehicleFacts: {
    make?: string;
    model?: string;
    year?: number;
    colour?: string;
  };
}): Promise<void> {
  if (!input.motHistoryData?.motTests?.length) return;

  const vehicle = await vehiclesService.upsert({
    registration: input.canonReg,
    make: input.vehicleFacts.make,
    model: input.vehicleFacts.model,
    year: input.vehicleFacts.year,
    colour: input.vehicleFacts.colour,
  });

  const tests = input.motHistoryData.motTests.slice(0, 12);
  for (const test of tests) {
    const eventAt = eventAtFromMotDate(test.completedDate);
    const sourceRef = `mot_test:${vehicle.id}:${test.completedDate}:${test.testResult}`;
    const miles = test.odometerValue ?? 0;
    const unit = test.odometerUnit ?? "mi";
    const advisories = advisoryCount(test);

    await vehicleTimelineService.upsertEventBySourceRef({
      vehicleId: vehicle.id,
      eventType: "mot_test",
      source: "dvsa_mot_history",
      sourceRef,
      title: `MOT ${test.testResult === "PASSED" ? "Pass" : "Fail"}`,
      description: `${miles} ${unit}${advisories > 0 ? `, ${advisories} advisory items` : ""}`,
      eventAt,
      metadata: {
        registration: input.canonReg,
        completedDate: test.completedDate,
        result: test.testResult,
        odometerValue: test.odometerValue,
        odometerUnit: test.odometerUnit,
        expiryDate: test.expiryDate,
        advisories,
      },
    });
  }
}

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
    // Fetch VES and MOT history in parallel; MOT history failure is non-fatal.
    const [raw, motHistoryData] = await Promise.all([
      fetchVehicleDetails(canon),
      fetchMotHistory(canon),
    ]);
    const normalized = normalizeDvlaVehicle(raw, canon);
    const report = buildVehicleReportFromDvla(canon, normalized, motHistoryData);
    await ingestMotTimelineEvents({
      canonReg: canon,
      motHistoryData,
      vehicleFacts: {
        make: normalized.make !== "Unknown" ? normalized.make : undefined,
        year: normalized.yearOfManufacture,
        colour: normalized.colour !== "Unknown" ? normalized.colour : undefined,
      },
    }).catch((err) => {
      console.warn("[vehicle-lookup] mot timeline ingest failed", canon, err);
    });
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
