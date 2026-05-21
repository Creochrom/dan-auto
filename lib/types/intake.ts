/**
 * Service advisor intake — structured workshop handoff (Gemini-ready).
 */

export type SymptomCategory =
  | "brakes"
  | "suspension"
  | "engine_warning"
  | "mot"
  | "battery"
  | "dpf"
  | "overheating"
  | "noise"
  | "steering"
  | "starting"
  | "general";

export type IntakeSeverity = "low" | "medium" | "high";

export type IntakePhase =
  | "welcome"
  | "symptom_capture"
  | "clarify"
  | "advise"
  | "collect_urgency"
  | "callback_offer"
  | "collect_name"
  | "collect_phone"
  | "collect_reg"
  | "collect_vehicle"
  | "collect_callback_window"
  | "complete";

export type MechanicIntakeSummary = {
  vehicle?: string;
  registration?: string;
  symptoms: string;
  possibleCauses: string[];
  estimatedRange: string;
  severity: IntakeSeverity;
  severityNote: string;
  callbackRequested: boolean;
  callbackWindow?: string;
  customerName?: string;
  customerPhone?: string;
};

export type IntakeState = {
  phase: IntakePhase;
  category?: SymptomCategory;
  symptomSummary: string;
  clarificationNotes: string[];
  clarifyAsked: boolean;
  possibleCauses: string[];
  estimateLow: number;
  estimateHigh: number;
  severity: IntakeSeverity;
  callbackRequested: boolean;
  leadCaptured: boolean;
};

export type SuggestionChip = {
  id: string;
  label: string;
  /** Sent as user message when tapped */
  message: string;
};
