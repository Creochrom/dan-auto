/**
 * Service advisor intake workflow — mirrors lib/services/service-advisor.engine.ts
 * for future Gemini tool orchestration.
 */

export const SERVICE_ADVISOR_PHASES = [
  "welcome",
  "symptom_capture",
  "clarify",
  "advise",
  "collect_urgency",
  "callback_offer",
  "collect_name",
  "collect_phone",
  "collect_reg",
  "collect_vehicle",
  "collect_callback_window",
  "complete",
] as const;

export type ServiceAdvisorPhase = (typeof SERVICE_ADVISOR_PHASES)[number];

export const MECHANIC_SUMMARY_FIELDS = [
  "vehicle",
  "registration",
  "symptoms",
  "possibleCauses",
  "estimatedRange",
  "severity",
  "callbackRequested",
  "callbackWindow",
  "customerName",
  "customerPhone",
] as const;
