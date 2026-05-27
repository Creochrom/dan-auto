import type { VehicleResult } from "@/lib/types/vehicle";

export type MotHistoryEntry = {
  date: string;
  result: "PASS" | "FAIL";
  mileage: number;
  advisories: string[];
};

export type RecommendedService = {
  id: string;
  title: string;
  description: string;
  priceFrom: number;
  priceLabel: string;
};

export type VehicleHealthScore = {
  score: number;
  label: string;
  explanation: string;
  tone: "excellent" | "good" | "attention" | "critical";
};

export type VehicleProfile = {
  imageUrl: string;
  imageAlt: string;
  makeModel: string;
  year: number;
  fuel: string;
  engine: string;
  motStatus: string;
  taxStatus: string;
  /** ISO date from DVLA when available */
  motExpiryDate?: string | null;
};

/** Normalized DVLA + MOT + AI enrichment — cache-friendly API shape */
export type VehicleReport = {
  reg: string;
  matched: boolean;
  unknown?: boolean;
  profile: VehicleProfile;
  health: VehicleHealthScore;
  commonIssues: string[];
  recommendedServices: RecommendedService[];
  motHistory: MotHistoryEntry[];
  /** Legacy shape for chat / estimate modals */
  legacy: VehicleResult;
  aiSummary: string;
};

export type VehicleLookupResponse = {
  reg: string;
  matched: boolean;
  cached?: boolean;
  report: VehicleReport;
};
