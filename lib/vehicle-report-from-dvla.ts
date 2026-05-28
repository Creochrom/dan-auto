import type { MotHistoryEntry, VehicleReport } from "@/lib/types/vehicle-report";
import type { VehicleResult } from "@/lib/types/vehicle";
import { formatPlate } from "@/lib/format-plate";
import type { NormalizedDvlaVehicle } from "@/lib/services/dvla/dvla.types";
import type { MotHistoryVehicle, MotTestRecord } from "@/lib/services/dvla/mot-history.service";
import { issuesFor, servicesFor } from "@/lib/vehicle-report-builder";
import { resolveVehicleImage } from "@/lib/vehicle-images";

function titleCaseMake(make: string): string {
  if (!make || make === "Unknown") return "Vehicle";
  return make
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function motFromDvla(
  motStatus: string,
  motExpiryDate: string | null
): Pick<VehicleResult, "motLine" | "motDays" | "motStatus"> {
  if (motExpiryDate) {
    const expiry = new Date(motExpiryDate);
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
    const litres = (dvla.engineCapacity / 1000).toFixed(1);
    return `${litres}L ${dvla.fuelType !== "Unknown" ? dvla.fuelType : "Engine"}`;
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

/**
 * Format a DVSA MOT date string ("2024-03-15 00:00:00.000" or ISO) to "Mar 2024".
 * Returns "—" on any parse failure.
 */
function formatMotDate(raw: string): string {
  try {
    // DVSA uses space-separated datetime; replace space with T for ISO parsing.
    const d = new Date(raw.replace(" ", "T"));
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function toMiles(value: number | null, unit: "mi" | "km" | null): number {
  if (!value) return 0;
  if (unit === "km") return Math.round(value * 0.621371);
  return value;
}

/**
 * Convert DVSA MotTestRecord[] to the frontend MotHistoryEntry[] shape.
 * Limits to the most recent 6 tests to keep the payload lean.
 */
function buildMotHistoryFromApi(tests: MotTestRecord[]): MotHistoryEntry[] {
  return tests.slice(0, 6).map((t) => {
    const advisories = (t.rfrAndComments ?? [])
      .filter((c) =>
        t.testResult === "PASSED"
          ? c.type === "ADVISORY"
          : ["ADVISORY", "MAJOR", "DANGEROUS", "PRS"].includes(c.type)
      )
      .map((c) => c.text);

    return {
      date: formatMotDate(t.completedDate),
      result: t.testResult === "PASSED" ? "PASS" : "FAIL",
      mileage: toMiles(t.odometerValue, t.odometerUnit),
      advisories: advisories.length > 0 ? advisories : ["No advisories"],
    };
  });
}

/** Build a full VehicleReport from normalized DVLA data (workshop enrichment layered on). */
export function buildVehicleReportFromDvla(
  canonReg: string,
  dvla: NormalizedDvlaVehicle,
  motHistoryData?: MotHistoryVehicle | null
): VehicleReport {
  const displayReg = formatPlate(canonReg);
  const makeModel = titleCaseMake(dvla.make);
  const fuel =
    dvla.fuelType.charAt(0).toUpperCase() + dvla.fuelType.slice(1).toLowerCase();
  const mot = motFromDvla(dvla.motStatus, dvla.motExpiryDate);

  // Real MOT history tests (newest first) when MOT_HISTORY_API_KEY is set.
  const realTests = motHistoryData?.motTests ?? [];
  const latestTest = realTests[0];
  const latestAdvisoryCount =
    latestTest?.testResult === "PASSED"
      ? (latestTest.rfrAndComments ?? []).filter((c) => c.type === "ADVISORY").length
      : 0;

  const legacy: VehicleResult = {
    reg: displayReg,
    makeModel,
    meta: `${dvla.yearOfManufacture} • ${fuel}`,
    motLine: mot.motLine,
    motDays: mot.motDays,
    motStatus: mot.motStatus,
    advisories: latestAdvisoryCount,
    recommendation: "Book inspection for a full workshop health score",
    imageUrl: resolveVehicleImage(makeModel).url,
    imageAlt: `${makeModel} — ${dvla.colour}`,
    estimatedFrom: 95,
    estimatedTo: 320,
    suggestedRepairs: [],
    aiInsight: `DVLA records matched for ${displayReg}. ${makeModel}, ${dvla.yearOfManufacture} ${fuel.toLowerCase()}.`,
  };

  const vehicleImage = resolveVehicleImage(makeModel);

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
      engine: engineLabel(dvla),
      motStatus: mot.motLine,
      taxStatus: taxLine(dvla.taxStatus),
      motExpiryDate: dvla.motExpiryDate,
    },
    health: {
      score: mot.motStatus === "valid" ? 82 : mot.motStatus === "due_soon" ? 68 : 52,
      label: mot.motStatus === "valid" ? "DVLA verified" : "Attention advised",
      explanation:
        realTests.length > 0 && latestAdvisoryCount > 0
          ? `${latestAdvisoryCount} advisor${latestAdvisoryCount === 1 ? "y" : "ies"} on last MOT — ${mot.motLine}. Book for a full workshop assessment.`
          : `Live DVLA data — ${mot.motLine}. Book inspection for advisories and wear items.`,
      tone: mot.motStatus === "valid" ? "good" : mot.motStatus === "due_soon" ? "attention" : "critical",
    },
    commonIssues: issuesFor(makeModel),
    recommendedServices: servicesFor(legacy),
    motHistory:
      realTests.length > 0
        ? buildMotHistoryFromApi(realTests)
        : [
            {
              date: dvla.motExpiryDate
                ? new Date(dvla.motExpiryDate).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              result: mot.motStatus === "urgent" ? ("FAIL" as const) : ("PASS" as const),
              mileage: 0,
              advisories: ["MOT history unavailable — set MOT_HISTORY_API_KEY to enable"],
            },
          ],
    legacy,
    aiSummary: legacy.aiInsight,
  };
}
