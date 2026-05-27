/**
 * Contextual routing for the service advisor — which UI path opened the chat
 * and how the model should behave. Extend surfaces here; do not fork chat UIs.
 */

import type { HeroConciergeMode } from "@/lib/types/hero-concierge";

/** When `explicit_only`, workshop email/leads require a confirmed handoff in UI. */
export type AdvisorHandoffPolicy = "explicit_only" | "standard";

export type AdvisorIntent =
  | "booking"
  | "diagnostic_help"
  | "vehicle_insights"
  | "account_signup"
  | "general";

/** Where the customer opened the advisor — drives tone and depth. */
export type AdvisorSurface =
  | "booking_flow"
  | "hero_ai_assistant"
  | "mot_help"
  | "warning_light_help"
  | "floating_widget"
  | "general";

export type AdvisorEntryPoint =
  | "hero_quick_booking"
  | "hero_ai_assistant"
  | "hero_vehicle_insights"
  | "hero_create_account"
  | "booking_form_help"
  | "mot_section"
  | "diagnostics_section"
  | "advisor_section"
  | "floating_widget"
  | string;

export type AdvisorVehicleSnapshot = {
  registration: string;
  make?: string;
  model?: string;
  year?: string;
  fuel?: string;
  engine?: string;
};

/** Payload stored on the chat session and sent from the client on each turn. */
export type AdvisorRouteContext = {
  entry_point: AdvisorEntryPoint;
  intent: AdvisorIntent;
  /** High-level UX context (booking vs hero diagnostic vs MOT help). */
  surface?: AdvisorSurface;
  vehicle_data?: AdvisorVehicleSnapshot;
  /** Hero concierge mode — adapts tone, chips, and escalation. */
  concierge_mode?: HeroConciergeMode;
  /** Hub card focus when multiple cards share the same concierge_mode. */
  concierge_focus?: "safe_to_drive";
  handoff_policy?: AdvisorHandoffPolicy;
};
