import type { VehicleResult } from "@/lib/types/vehicle";
import { stripPlate } from "@/lib/format-plate";

/** Dark workshop interior — ambient only, heavily graded in UI */
export const HERO_GARAGE_IMAGE =
  "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1920&q=78&auto=format&fit=crop";

/** Hero BMW — cinematic rear workshop photo only (not a UI screenshot) */
export const HERO_SHOWCASE_VEHICLE = "/hero-bmw.jpg";

/** Layer stack for hero collage — abstract detail only (no showroom hero car). */
export const HERO_LAYER_SILHOUETTE =
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1400&q=72&auto=format&fit=crop";

export const HERO_LAYER_CARBON =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format&fit=crop";

export const HERO_LAYER_HEADLIGHT =
  "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=900&q=80&auto=format&fit=crop";

export const HERO_LAYER_BRAKE =
  "https://images.unsplash.com/photo-1579127166277-f49fe339259b?w=900&q=80&auto=format&fit=crop";

export const HERO_LAYER_TOOLS =
  "https://images.unsplash.com/photo-1631543905212-94f8c277cd9e?w=900&q=78&auto=format&fit=crop";

const DETAIL_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1579127166277-f49fe339259b?w=1200&q=82&auto=format&fit=crop",
    alt: "Precision brake and wheel hardware — workshop detail",
  },
  {
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=82&auto=format&fit=crop",
    alt: "Premium cockpit materials — performance interior detail",
  },
  {
    url: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200&q=82&auto=format&fit=crop",
    alt: "LED headlamp engineering detail",
  },
  {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=82&auto=format&fit=crop",
    alt: "Carbon composite texture — motorsport specification",
  },
] as const;

const VEHICLE_ENTRIES: Record<string, Omit<VehicleResult, "reg">> = {
  AB12CDE: {
    makeModel: "BMW 320D M Sport",
    meta: "2019 • Diesel • Automatic",
    motLine: "MOT expires in 43 days",
    motDays: 43,
    motStatus: "due_soon",
    advisories: 2,
    recommendation: "Full inspection recommended",
    imageUrl: DETAIL_IMAGES[0].url,
    imageAlt: DETAIL_IMAGES[0].alt,
    estimatedFrom: 185,
    estimatedTo: 420,
    suggestedRepairs: ["Front brake pads", "Rear tyre wear — advisory"],
    aiInsight:
      "DVLA records matched. Workshop intelligence flags brake wear typical at this mileage — book a full inspection.",
  },
  BMW320D: {
    makeModel: "BMW 320D M Sport",
    meta: "2019 • Diesel • Automatic",
    motLine: "MOT expires in 43 days",
    motDays: 43,
    motStatus: "due_soon",
    advisories: 2,
    recommendation: "Full inspection recommended",
    imageUrl: DETAIL_IMAGES[0].url,
    imageAlt: DETAIL_IMAGES[0].alt,
    estimatedFrom: 185,
    estimatedTo: 420,
    suggestedRepairs: ["Front brake pads", "Rear tyre wear — advisory"],
    aiInsight:
      "DVLA records matched. Workshop intelligence flags brake wear typical at this mileage.",
  },
  WP56YAD: {
    makeModel: "BMW 320D M Sport",
    meta: "2019 • Diesel • Automatic • 48,200 miles",
    motLine: "MOT expires in 43 days",
    motDays: 43,
    motStatus: "due_soon",
    advisories: 2,
    recommendation: "Full inspection recommended",
    imageUrl: DETAIL_IMAGES[0].url,
    imageAlt: DETAIL_IMAGES[0].alt,
    estimatedFrom: 185,
    estimatedTo: 420,
    suggestedRepairs: ["Front brake pads", "Rear tyre wear — advisory"],
    aiInsight:
      "Matched to BMW 320D M Sport. AI recommends scheduling inspection before MOT due date.",
  },
  AU14SLN: {
    makeModel: "Audi A4 S Line",
    meta: "2018 • Diesel • S tronic • 58,200 miles",
    motLine: "MOT expires in 112 days",
    motDays: 112,
    motStatus: "valid",
    advisories: 0,
    recommendation: "Interim service due",
    imageUrl: DETAIL_IMAGES[1].url,
    imageAlt: DETAIL_IMAGES[1].alt,
    estimatedFrom: 145,
    estimatedTo: 310,
    suggestedRepairs: ["Oil & filter service", "Cabin filter"],
    aiInsight:
      "Clean MOT history on file. Recommend interim service to protect DPF and maintain intervals.",
  },
  AUDIA4: {
    makeModel: "Audi A4 S Line",
    meta: "2018 • Diesel • S tronic",
    motLine: "MOT expires in 112 days",
    motDays: 112,
    motStatus: "valid",
    advisories: 0,
    recommendation: "Interim service due",
    imageUrl: DETAIL_IMAGES[1].url,
    imageAlt: DETAIL_IMAGES[1].alt,
    estimatedFrom: 145,
    estimatedTo: 310,
    suggestedRepairs: ["Oil & filter service", "Cabin filter"],
    aiInsight: "Audi A4 S Line identified. Service interval approaching manufacturer recommendation.",
  },
  ME20AMG: {
    makeModel: "Mercedes C220 AMG Line",
    meta: "2020 • Diesel • Automatic • 36,100 miles",
    motLine: "MOT expires in 28 days",
    motDays: 28,
    motStatus: "urgent",
    advisories: 1,
    recommendation: "Brake check advised before MOT",
    imageUrl: DETAIL_IMAGES[2].url,
    imageAlt: DETAIL_IMAGES[2].alt,
    estimatedFrom: 220,
    estimatedTo: 540,
    suggestedRepairs: ["Rear brake disc scoring", "MOT pre-check package"],
    aiInsight:
      "MOT due within 30 days. One advisory on record — pre-MOT inspection recommended.",
  },
  MERC220: {
    makeModel: "Mercedes C220 AMG Line",
    meta: "2020 • Diesel • Automatic",
    motLine: "MOT expires in 28 days",
    motDays: 28,
    motStatus: "urgent",
    advisories: 1,
    recommendation: "Brake check advised before MOT",
    imageUrl: DETAIL_IMAGES[2].url,
    imageAlt: DETAIL_IMAGES[2].alt,
    estimatedFrom: 220,
    estimatedTo: 540,
    suggestedRepairs: ["Rear brake disc scoring", "MOT pre-check package"],
    aiInsight: "Mercedes C220 AMG Line matched. Urgent MOT window — book inspection soon.",
  },
  VW18GTD: {
    makeModel: "VW Golf GTD",
    meta: "2017 • Diesel • DSG • 71,400 miles",
    motLine: "MOT expires in 67 days",
    motDays: 67,
    motStatus: "due_soon",
    advisories: 3,
    recommendation: "Diagnostics recommended",
    imageUrl: DETAIL_IMAGES[3].url,
    imageAlt: DETAIL_IMAGES[3].alt,
    estimatedFrom: 195,
    estimatedTo: 680,
    suggestedRepairs: ["Engine management scan", "Suspension bush wear", "Exhaust mount"],
    aiInsight:
      "Multiple advisories flagged. Full diagnostics advised before MOT to identify underlying faults.",
  },
  GOLFGTD: {
    makeModel: "VW Golf GTD",
    meta: "2017 • Diesel • DSG",
    motLine: "MOT expires in 67 days",
    motDays: 67,
    motStatus: "due_soon",
    advisories: 3,
    recommendation: "Diagnostics recommended",
    imageUrl: DETAIL_IMAGES[3].url,
    imageAlt: DETAIL_IMAGES[3].alt,
    estimatedFrom: 195,
    estimatedTo: 680,
    suggestedRepairs: ["Engine management scan", "Suspension bush wear"],
    aiInsight: "VW Golf GTD identified. AI suggests diagnostics before MOT due date.",
  },
};

const UNKNOWN_VEHICLE: Omit<VehicleResult, "reg"> = {
  unknown: true,
  makeModel: "Vehicle not recognised",
  meta: "Limited DVLA data — manual verification required",
  motLine: "MOT status unavailable",
  motDays: 0,
  motStatus: "valid",
  advisories: 0,
  recommendation: "Book inspection for identification",
  imageUrl: DETAIL_IMAGES[3].url,
  imageAlt: "Workshop diagnostic equipment",
  estimatedFrom: 95,
  estimatedTo: 280,
  suggestedRepairs: ["Full vehicle identification", "Diagnostic scan"],
  aiInsight:
    "Registration not found in our DVLA sample. Our team can verify details on arrival and run a full diagnostic scan.",
};

function formatDisplayReg(canon: string) {
  return canon.length <= 4 ? canon : `${canon.slice(0, 4)} ${canon.slice(4)}`.trim();
}

export type VehicleLookupResult = {
  vehicle: VehicleResult;
  matched: boolean;
};

export function mockVehicleLookup(reg: string): VehicleLookupResult {
  const canon = stripPlate(reg);
  const displayReg = formatDisplayReg(canon) || canon;
  const entry = VEHICLE_ENTRIES[canon];

  if (entry) {
    return {
      matched: true,
      vehicle: { reg: displayReg, ...entry },
    };
  }

  return {
    matched: false,
    vehicle: { reg: displayReg, ...UNKNOWN_VEHICLE },
  };
}

/** @deprecated Use mockVehicleLookup().vehicle — kept for legacy callers */
export function mockVehicleLookupLegacy(reg: string): VehicleResult {
  return mockVehicleLookup(reg).vehicle;
}

export const SCAN_STEPS = [
  "Connecting to DVLA vehicle records…",
  "Retrieving MOT & tax status…",
  "Correlating workshop intelligence…",
  "Running AI diagnostic synthesis…",
] as const;

/** Demo registrations surfaced in UI hints */
export const DEMO_REGISTRATIONS = [
  "AB12 CDE",
  "AU14 SLN",
  "ME20 AMG",
  "VW18 GTD",
] as const;
