export type VehicleResult = {
  reg: string;
  /** True when registration is not in the mock DVLA dataset. */
  unknown?: boolean;
  makeModel: string;
  meta: string;
  motLine: string;
  advisories: number;
  recommendation: string;
  imageUrl: string;
  imageAlt: string;
  motDays: number;
  motStatus: "valid" | "due_soon" | "urgent";
  estimatedFrom: number;
  estimatedTo: number;
  suggestedRepairs: string[];
  aiInsight: string;
};
