import type { MotHistoryEntry, VehicleReport } from "@/lib/types/vehicle-report";
import type { VehicleResult } from "@/lib/types/vehicle";
import { formatPlate } from "@/lib/format-plate";
import type { NormalizedDvlaVehicle } from "@/lib/services/dvla/dvla.types";
import type { MotHistoryVehicle, MotTestRecord } from "@/lib/integrations/dvsa-mot";
import { issuesFor, servicesFor } from "@/lib/vehicle-report-builder";
import {
  buildMotHealthSummary,
  buildMotHistoryFromApi,
  buildMotServiceOpportunities,
} from "@/lib/mot/mot-report";
import {
  engineLabelFromCapacity,
  extractEngineDisplacement,
} from "@/lib/vehicle-engine-display";
import { resolveVehicleImage } from "@/lib/vehicle-images";

function titleCaseMake(make: string): string {
  if (!make || make === "Unknown") return "Vehicle";
  return make
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseDvsaDate(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const normalized = raw.trim().replace(/\./g, "-").replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function motFromDvla(
  motStatus: string,
  motExpiryDate: string | null
): Pick<VehicleResult, "motLine" | "motDays" | "motStatus"> {
  const isoExpiry = motExpiryDate ? parseDvsaDate(motExpiryDate) : null;
  if (isoExpiry) {
    const expiry = new Date(isoExpiry);
    const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
    if (days > 30) {
      return { motLine: "MOT valid", motDays: days, motStatus: "valid" };
    }
    if (days > 0) {
      return {
        motLine: `MOT expires in ${days} day${days === 1 ? "" : "s"}`,
        motDays: days,
        motStatus: "due_soon",
      };
    }
    return { motLine: "MOT expired", motDays: days, motStatus: "urgent" };
  }

  const lower = motStatus.toLowerCase();
  if (lower.includes("valid") && !lower.includes("not")) {
    return { motLine: "MOT valid", motDays: 90, motStatus: "valid" };
  }
  if (lower.includes("not") || lower.includes("no details")) {
    return {
      motLine: motStatus === "Unknown" ? "MOT status unavailable" : motStatus,
      motDays: 0,
      motStatus: "due_soon",
    };
  }

  return { motLine: motStatus, motDays: 30, motStatus: "due_soon" };
}

function engineLabel(dvla: NormalizedDvlaVehicle): string {
  if (dvla.engineCapacity && dvla.engineCapacity > 0) {
    return engineLabelFromCapacity(dvla.engineCapacity, dvla.fuelType);
  }
  return dvla.fuelType !== "Unknown" ? dvla.fuelType : "Engine details unavailable";
}

function taxLine(taxStatus: string): string {
  const lower = taxStatus.toLowerCase();
  if (lower.includes("taxed") || lower === "valid") return "Taxed";
  if (lower.includes("sorn")) return "SORN";
  if (lower.includes("untaxed")) return "Untaxed";
  return taxStatus;
}

function latestAdvisoryCount(test: MotTestRecord | undefined): number {
  if (!test) return 0;
  return (test.rfrAndComments ?? []).filter((c) => c.type === "ADVISORY").length;
}

/** Build a full VehicleReport from normalized DVLA data + optional DVSA MOT history. */
export function buildVehicleReportFromDvla(
  canonReg: string,
  dvla: NormalizedDvlaVehicle,
  motHistoryData?: MotHistoryVehicle | null
): VehicleReport {
  const displayReg = formatPlate(canonReg);
  const makeModel = titleCaseMake(dvla.make);
  const fuel =
    dvla.fuelType.charAt(0).toUpperCase() + dvla.fuelType.slice(1).toLowerCase();
  const realTests = motHistoryData?.motTests ?? [];
  const motHistoryAvailable = realTests.length > 0;
  const motHistory: MotHistoryEntry[] = motHistoryAvailable
    ? buildMotHistoryFromApi(realTests)
    : [];

  const latestTest = realTests[0];
  const latestExpiry = latestTest?.expiryDate ?? dvla.motExpiryDate;
  const mot = motFromDvla(dvla.motStatus, latestExpiry ?? dvla.motExpiryDate);
  const latestAdvisoryCountValue = latestAdvisoryCount(latestTest);
  const motHealthSummary = buildMotHealthSummary(motHistory);
  const latestEntry = motHistory[0];

  const engine = engineLabel(dvla);
  const engineShort = extractEngineDisplacement(engine);
  const metaParts = [String(dvla.yearOfManufacture), fuel];
  if (engineShort) metaParts.push(engineShort);

  const legacy: VehicleResult = {
    reg: displayReg,
    makeModel,
    meta: metaParts.join(" • "),
    motLine: mot.motLine,
    motDays: mot.motDays,
    motStatus: mot.motStatus,
    advisories: latestAdvisoryCountValue,
    recommendation: motHistoryAvailable
      ? "Review MOT advisories and book any recommended checks"
      : "Book inspection for a full workshop health score",
    imageUrl: resolveVehicleImage(makeModel).url,
    imageAlt: `${makeModel} — ${dvla.colour}`,
    estimatedFrom: 95,
    estimatedTo: 320,
    suggestedRepairs: latestEntry
      ? [...latestEntry.advisories, ...latestEntry.failures].slice(0, 4)
      : [],
    aiInsight: motHistoryAvailable
      ? `DVLA records matched for ${displayReg}. ${motHealthSummary[0]}`
      : `DVLA records matched for ${displayReg}. ${makeModel}, ${dvla.yearOfManufacture} ${fuel.toLowerCase()}.`,
  };

  const vehicleImage = resolveVehicleImage(makeModel);
  const templateServices = servicesFor(legacy);

  return {
    reg: displayReg,
    matched: true,
    unknown: false,
    profile: {
      imageUrl: vehicleImage.url,
      imageAlt: vehicleImage.alt,
      makeModel,
      year: dvla.yearOfManufacture,
      fuel,
      engine,
      motStatus: mot.motLine,
      taxStatus: taxLine(dvla.taxStatus),
      motExpiryDate: latestExpiry ?? dvla.motExpiryDate,
    },
    health: {
      score: mot.motStatus === "valid" ? 82 : mot.motStatus === "due_soon" ? 68 : 52,
      label: mot.motStatus === "valid" ? "DVLA verified" : "Attention advised",
      explanation:
        motHistoryAvailable && latestAdvisoryCountValue > 0
          ? `${latestAdvisoryCountValue} advisor${latestAdvisoryCountValue === 1 ? "y" : "ies"} on last MOT — ${mot.motLine}. Book for a full workshop assessment.`
          : motHistoryAvailable
            ? `Live DVLA + MOT data — ${mot.motLine}.`
            : `Live DVLA data — ${mot.motLine}. MOT test history unavailable from DVSA.`,
      tone: mot.motStatus === "valid" ? "good" : mot.motStatus === "due_soon" ? "attention" : "critical",
    },
    commonIssues: issuesFor(makeModel),
    recommendedServices: buildMotServiceOpportunities(motHistory, templateServices),
    motHistory,
    motHistoryAvailable,
    motHealthSummary,
    lastMot: latestEntry
      ? {
          date: latestEntry.date,
          result: latestEntry.result,
          advisoryCount: latestEntry.advisoryCount,
          defectCount: latestEntry.defectCount,
        }
      : undefined,
    previousMotDate: motHistory[1]?.date ?? null,
    legacy,
    aiSummary: legacy.aiInsight,
  };
}
