import type { LucideIcon } from "lucide-react";

/** Primary concierge entry modes — not symptom shortcuts. */
export type HeroConciergeMode =
  | "hub"
  | "diagnostic"
  | "pricing"
  | "callback"
  | "booking"
  | "quick_question";

export type HeroIntentCard = {
  id: string;
  mode: Exclude<HeroConciergeMode, "hub">;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Opening user message when this intent is selected. */
  message: string;
};

