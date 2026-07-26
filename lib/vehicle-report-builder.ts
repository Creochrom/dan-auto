import type {
  MotHistoryEntry,
  RecommendedService,
  VehicleHealthScore,
  VehicleProfile,
  VehicleReport,
} from "@/lib/types/vehicle-report";
import type { VehicleResult } from "@/lib/types/vehicle";
import { buildMotHealthSummary } from "@/lib/mot/mot-report";
import { mockVehicleLookup } from "@/lib/vehicle-data";
import { resolveVehicleImage } from "@/lib/vehicle-images";

const MODEL_ISSUES: Record<string, string[]> = {
  BMW: ["Brake wear at 45k+ miles", "Timing chain inspection advised", "Battery drain on short trips"],
  AUDI: ["DPF regeneration cycles", "Suspension bush wear", "Oil consumption checks"],
  MERCEDES: ["Brake wear", "AdBlue system checks", "Battery & alternator load"],
  VW: ["DPF clogging risk", "DSG service intervals", "Suspension mount wear"],
  DEFAULT: ["Brake wear", "Battery condition", "Fluid & filter intervals", "Tyre age & tread"],
};

const SERVICE_TEMPLATES: Omit<RecommendedService, "id">[] = [
  {
    title: "MOT preparation",
    description: "Pre-test inspection, lamps, brakes & emissions check.",
    priceFrom: 49,
    priceLabel: "from £49",
  },
  {
    title: "Interim service",
    description: "Oil, filters and safety checks to manufacturer schedule.",
    priceFrom: 129,
    priceLabel: "from £129",
  },
  {
    title: "Brake inspection",
    description: "Pads, discs and fluid — advisory items addressed early.",
    priceFrom: 39,
    priceLabel: "from £39",
  },
  {
    title: "Diagnostics",
    description: "Full fault-code scan with AI-assisted report.",
    priceFrom: 69,
    priceLabel: "from £69",
  },
];

function parseMeta(meta: string) {
  const yearMatch = meta.match(/\b(19|20)\d{2}\b/);
  const fuelMatch = meta.match(/(Petrol|Diesel|Electric|Hybrid)/i);
  return {
    year: yearMatch ? Number(yearMatch[0]) : 2018,
    fuel: fuelMatch?.[1] ?? "Diesel",
  };
}

function taxStatusFor(motStatus: VehicleResult["motStatus"]): string {
  if (motStatus === "urgent") return "Tax valid — MOT due imminently";
  if (motStatus === "due_soon") return "Tax valid — renew with MOT";
  return "Taxed & MOT in date";
}

function motStatusLabel(vehicle: VehicleResult): string {
  if (vehicle.unknown) return "MOT status unavailable";
  if (vehicle.motStatus === "urgent") return vehicle.motLine;
  if (vehicle.motStatus === "due_soon") return vehicle.motLine;
  return vehicle.motLine;
}

function healthFor(vehicle: VehicleResult): VehicleHealthScore {
  if (vehicle.unknown) {
    return {
      score: 0,
      label: "Unverified",
      explanation: "Limited data — book inspection for a full health score.",
      tone: "attention",
    };
  }

  const base =
    94 -
    vehicle.advisories * 6 -
    (vehicle.motStatus === "urgent" ? 14 : vehicle.motStatus === "due_soon" ? 6 : 0);
  const score = Math.max(42, Math.min(98, base));

  let tone: VehicleHealthScore["tone"] = "excellent";
  if (score < 55) tone = "critical";
  else if (score < 72) tone = "attention";
  else if (score < 85) tone = "good";

  const label =
    score >= 85
      ? "Strong condition"
      : score >= 72
        ? "Good — minor advisories"
        : score >= 55
          ? "Attention advised"
          : "Schedule inspection soon";

  const explanation =
    vehicle.advisories > 0
      ? `${vehicle.advisories} advisory${vehicle.advisories > 1 ? "ies" : ""} on record — ${vehicle.recommendation.toLowerCase()}`
      : "Clean MOT history with no outstanding advisories on file.";

  return { score, label, explanation, tone };
}

export function issuesFor(makeModel: string): string[] {
  const key = Object.keys(MODEL_ISSUES).find((k) => makeModel.toUpperCase().includes(k));
  return MODEL_ISSUES[key ?? "DEFAULT"] ?? MODEL_ISSUES.DEFAULT;
}

function motEntry(
  date: string,
  result: "PASS" | "FAIL",
  mileage: number,
  advisories: string[],
  failures: string[] = []
): MotHistoryEntry {
  return {
    date,
    result,
    mileage,
    advisories,
    failures,
    advisoryCount: advisories.length,
    defectCount: failures.length,
  };
}

function motHistoryFor(vehicle: VehicleResult, year: number): MotHistoryEntry[] {
  if (vehicle.unknown) {
    return [
      motEntry("—", "PASS", 0, ["No MOT history in demo dataset"]),
    ];
  }

  const miles = vehicle.meta.match(/([\d,]+)\s*miles/i);
  const currentMileage = miles ? Number(miles[1].replace(/,/g, "")) : 52000;

  return [
    motEntry(
      `Mar ${year}`,
      "PASS",
      currentMileage,
      vehicle.advisories > 0
        ? vehicle.suggestedRepairs.slice(0, 2)
        : ["No advisories"]
    ),
    motEntry(`Mar ${year - 1}`, "PASS", currentMileage - 11200, [
      "Nearside rear tyre — advisory",
    ]),
    motEntry(`Mar ${year - 2}`, "PASS", currentMileage - 22800, ["No advisories"]),
  ];
}

export function servicesFor(vehicle: VehicleResult): RecommendedService[] {
  return SERVICE_TEMPLATES.map((t, i) => ({
    id: `svc-${i}`,
    ...t,
    priceFrom:
      i === 0 && vehicle.motStatus !== "valid"
        ? 59
        : i === 3 && vehicle.advisories >= 2
          ? 79
          : t.priceFrom,
    priceLabel:
      i === 0 && vehicle.motStatus !== "valid"
        ? "from £59"
        : i === 3 && vehicle.advisories >= 2
          ? "from £79"
          : t.priceLabel,
  }));
}

function engineFor(makeModel: string, fuel: string): string {
  if (makeModel.includes("320D")) return "2.0L Turbo Diesel (B47)";
  if (makeModel.includes("A4")) return "2.0L TDI";
  if (makeModel.includes("C220")) return "2.0L Diesel (OM654)";
  if (makeModel.includes("GTD")) return "2.0L TDI (DSG)";
  return fuel === "Diesel" ? "2.0L Diesel" : "2.0L Petrol";
}

export function buildVehicleReport(reg: string): VehicleReport {
  const { vehicle, matched } = mockVehicleLookup(reg);
  const { year, fuel } = parseMeta(vehicle.meta);

  const vehicleImage = resolveVehicleImage(vehicle.makeModel, {
    unknown: vehicle.unknown,
  });

  const profile: VehicleProfile = {
    imageUrl: vehicleImage.url,
    imageAlt: vehicleImage.alt,
    makeModel: vehicle.makeModel,
    year,
    fuel,
    engine: engineFor(vehicle.makeModel, fuel),
    motStatus: motStatusLabel(vehicle),
    taxStatus: vehicle.unknown ? "Tax status unavailable" : taxStatusFor(vehicle.motStatus),
  };

  const motHistory = motHistoryFor(vehicle, year);

  return {
    reg: vehicle.reg,
    matched,
    unknown: vehicle.unknown,
    profile,
    health: healthFor(vehicle),
    commonIssues: issuesFor(vehicle.makeModel),
    recommendedServices: servicesFor(vehicle),
    motHistory,
    motHistoryAvailable: !vehicle.unknown,
    motHealthSummary: vehicle.unknown ? [] : buildMotHealthSummary(motHistory),
    lastMot: motHistory[0]
      ? {
          date: motHistory[0].date,
          result: motHistory[0].result,
          advisoryCount: motHistory[0].advisoryCount,
          defectCount: motHistory[0].defectCount,
        }
      : undefined,
    previousMotDate: motHistory[1]?.date ?? null,
    legacy: vehicle,
    aiSummary: vehicle.aiInsight,
  };
}
