import type { VehicleReport } from "@/lib/types/vehicle-report";
import type { VehicleResult } from "@/lib/types/vehicle";
import { formatPlate } from "@/lib/format-plate";
import type { NormalizedDvlaVehicle } from "@/lib/services/dvla/dvla.types";
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

/** Build a full VehicleReport from normalized DVLA data (workshop enrichment layered on). */
export function buildVehicleReportFromDvla(
  canonReg: string,
  dvla: NormalizedDvlaVehicle
): VehicleReport {
  const displayReg = formatPlate(canonReg);
  const makeModel = titleCaseMake(dvla.make);
  const fuel =
    dvla.fuelType.charAt(0).toUpperCase() + dvla.fuelType.slice(1).toLowerCase();
  const mot = motFromDvla(dvla.motStatus, dvla.motExpiryDate);

  const legacy: VehicleResult = {
    reg: displayReg,
    makeModel,
    meta: `${dvla.yearOfManufacture} • ${fuel}`,
    motLine: mot.motLine,
    motDays: mot.motDays,
    motStatus: mot.motStatus,
    advisories: 0,
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
      explanation: `Live DVLA data — ${mot.motLine}. Book inspection for advisories and wear items.`,
      tone: mot.motStatus === "valid" ? "good" : mot.motStatus === "due_soon" ? "attention" : "critical",
    },
    commonIssues: issuesFor(makeModel),
    recommendedServices: servicesFor(legacy),
    motHistory: [
      {
        date: dvla.motExpiryDate
          ? new Date(dvla.motExpiryDate).toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            })
          : "—",
        result: mot.motStatus === "urgent" ? "FAIL" : "PASS",
        mileage: 0,
        advisories: ["MOT history from DVLA — mileage from MOT API when connected"],
      },
    ],
    legacy,
    aiSummary: legacy.aiInsight,
  };
}
