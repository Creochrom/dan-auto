"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Calendar,
  Check,
  LayoutGrid,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import type { HeroOnboardingActionId } from "@/lib/hero-onboarding";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import { LAYER } from "@/lib/ui/layers";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  open: boolean;
  report: VehicleReport;
  selectedAction: HeroOnboardingActionId | null;
  dimmed?: boolean;
  /** When true, render inside hero-stage (no body portal / no page-wide fixed overlay). */
  heroScoped?: boolean;
  onSelectAction: (id: HeroOnboardingActionId) => void;
  onClose: () => void;
};

function vehicleSubtitle(report: VehicleReport): string {
  const { year, fuel, engine } = report.profile;
  return [year, fuel, engine].filter(Boolean).join(" • ");
}

export function HeroOnboardingModal({
  open,
  report,
  selectedAction,
  dimmed = false,
  heroScoped = false,
  onSelectAction,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const backdropClass = heroScoped
    ? "hero-scoped-modal-backdrop absolute inset-0 z-[55] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-md"
    : `fixed inset-0 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md ${LAYER.modalBackdrop}`;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="hero-onboarding-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: dimmed ? 0.35 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className={backdropClass}
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="hero-onboarding-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.32, ease: EASE }}
            className={`relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c0b09] via-[#070605] to-[#050403] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.05)] ${LAYER.modal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
              aria-hidden
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/50 text-zinc-400 transition hover:border-white/25 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative border-b border-white/[0.06] px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Vehicle found
              </p>
              <h2
                id="hero-onboarding-title"
                className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl"
              >
                {report.profile.makeModel}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">{vehicleSubtitle(report)}</p>
            </div>

            <div className="relative space-y-2 p-4 sm:p-5">
              {ACTIONS.map((action) => {
                const active = selectedAction === action.id;
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectAction(action.id)}
                    className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition duration-200 ${
                      active
                        ? "border-amber-400/45 bg-amber-400/[0.07] shadow-[0_0_0_1px_rgba(212,166,60,0.16),0_0_20px_-8px_rgba(232,197,71,0.35)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/18 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition ${
                        active
                          ? "bg-amber-400/15 ring-amber-400/40"
                          : "bg-black/40 ring-white/10 group-hover:ring-amber-400/25"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-amber-200" : "text-amber-300/80"}`}
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold ${active ? "text-amber-100" : "text-white"}`}
                      >
                        {action.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-zinc-500">
                        {action.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (heroScoped) return content;
  return createPortal(content, document.body);
}
