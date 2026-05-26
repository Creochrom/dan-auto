/**
 * Structured repair intake — maintained alongside chat (Gemini-extracted).
 */

export type StructuredIntakeCustomer = {
  name: string;
  contact: string;
};

export type StructuredIntakeVehicle = {
  make: string;
  model: string;
  year: string;
  engine: string;
  mileage: string;
};

export type StructuredIntakeIssue = {
  symptoms: string[];
  warningLights: string[];
  startedWhen: string;
  drivable: boolean | null;
  severity: string;
};

export type StructuredIntakeEstimate = {
  possibleCauses: string[];
  estimatedPriceRange: string;
  urgencyLevel: string;
  recommendedNextStep: string;
  /** 1–2 sentence narrative the workshop reads first. AI-authored. */
  summary: string;
};

/** Customer intent — drives email routing and CRM tagging. */
export type StructuredIntakeIntent =
  | "book"        // wants a workshop slot now
  | "callback"    // wants a mechanic to call them back
  | "quote"       // wants an indicative price first
  | "info_only"   // just exploring / general question
  | "";           // not yet determined

/** Canonical structured intake JSON for mechanic handoff and CRM. */
export type StructuredIntake = {
  customer: StructuredIntakeCustomer;
  vehicle: StructuredIntakeVehicle;
  issue: StructuredIntakeIssue;
  media: string[];
  aiEstimate: StructuredIntakeEstimate;
  /** Explicit booking/callback intent extracted by the AI. */
  intent: StructuredIntakeIntent;
  /** Free-text preferred slot when customer named one ("Tomorrow afternoon", "Sat morning"). */
  preferredBookingTime: string;
};

export function createEmptyStructuredIntake(): StructuredIntake {
  return {
    customer: { name: "", contact: "" },
    vehicle: { make: "", model: "", year: "", engine: "", mileage: "" },
    issue: {
      symptoms: [],
      warningLights: [],
      startedWhen: "",
      drivable: null,
      severity: "",
    },
    media: [],
    aiEstimate: {
      possibleCauses: [],
      estimatedPriceRange: "",
      urgencyLevel: "",
      recommendedNextStep: "",
      summary: "",
    },
    intent: "",
    preferredBookingTime: "",
  };
}
