"use client";

import {
  Bot,
  Calendar,
  LayoutGrid,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { HeroOnboardingActionId } from "@/lib/hero-onboarding";
import type { VehicleReport } from "@/lib/types/vehicle-report";

type ActionCard = {
  id: HeroOnboardingActionId;
  title: string;
  description: string;
  icon: LucideIcon;
};

const ACTIONS: ActionCard[] = [
  {
    id: "quick_booking",
    title: "Quick booking",
    description:
      "Book your vehicle for servicing, diagnostics or repairs in minutes.",
    icon: Calendar,
  },
  {
    id: "service_advisor",
    title: "Talk to service advisor",
    description:
      "Describe the issue and our 24/7 AI assistant will help identify possible causes, estimated repair range and next steps.",
    icon: Bot,
  },
  {
    id: "vehicle_insights",
    title: "Vehicle insights",
    description: "View detailed AI-powered analysis and vehicle information.",
    icon: LayoutGrid,
  },
  {
    id: "create_account",
    title: "Create account",
    description:
      "Save vehicle history, bookings and future diagnostics in one place.",
    icon: UserPlus,
  },
];

type Props = {
  report: VehicleReport;
  selectedAction: HeroOnboardingActionId | null;
  onSelectAction: (id: HeroOnboardingActionId) => void;
};

function vehicleSubtitle(report: VehicleReport): string {
  const { year, fuel, engine } = report.profile;
  return [year, fuel, engine].filter(Boolean).join(" • ");
}

export function HeroEntryActionsPanel({
  report,
  selectedAction,
  onSelectAction,
}: Props) {
  return (
    <div className="hero-entry-panel">
      <header className="hero-entry-panel__header px-4 pb-3 pt-2 sm:px-5 sm:pb-4">
        <h2 className="text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
          {report.profile.makeModel}
        </h2>
        <p className="mt-1 text-[12px] leading-snug text-zinc-400">
          {vehicleSubtitle(report)}
        </p>
      </header>

      <div
        className="hero-entry-panel__actions divide-y divide-white/[0.06] border-t border-white/[0.06]"
        role="list"
      >
        {ACTIONS.map((action) => {
          const active = selectedAction === action.id;
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              role="listitem"
              aria-pressed={active}
              onClick={() => onSelectAction(action.id)}
              className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 sm:px-5 ${
                active
                  ? "bg-amber-400/[0.07]"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition sm:h-9 sm:w-9 ${
                  active
                    ? "bg-amber-400/15 text-amber-200"
                    : "bg-white/[0.04] text-amber-300/80 group-hover:bg-white/[0.07]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[13px] font-semibold sm:text-sm ${active ? "text-amber-100" : "text-white"}`}
                >
                  {action.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500 sm:text-[12px]">
                  {action.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
