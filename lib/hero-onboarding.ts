import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

/** Primary hero onboarding paths after a successful plate lookup. */
export type HeroOnboardingActionId =
  | "quick_booking"
  | "service_advisor"
  | "vehicle_insights"
  | "create_account";

export type HeroInsightCategoryId =
  | "health"
  | "issues"
  | "mot"
  | "services"
  | "premium";

/** Maps insight hub choices to existing floating report window ids. */
export const HERO_INSIGHT_CATEGORIES: {
  id: HeroInsightCategoryId;
  windowId: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "health",
    windowId: "health",
    label: "Vehicle health score",
    description: "AI-assisted condition overview",
    icon: Activity,
  },
  {
    id: "issues",
    windowId: "issues",
    label: "Common issues",
    description: "Model-specific patterns to watch",
    icon: AlertTriangle,
  },
  {
    id: "mot",
    windowId: "mot",
    label: "MOT history",
    description: "Past results and advisories",
    icon: CalendarCheck,
  },
  {
    id: "services",
    windowId: "services",
    label: "Recommended services",
    description: "Suggested work for this vehicle",
    icon: Wrench,
  },
  {
    id: "premium",
    windowId: "premium",
    label: "Premium report",
    description: "Full AI report and member unlock",
    icon: Sparkles,
  },
];
