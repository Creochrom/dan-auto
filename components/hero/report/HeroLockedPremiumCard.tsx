"use client";

import { Lock, Sparkles } from "lucide-react";
import { PREMIUM_MEMBERSHIP_FROM } from "@/lib/membership";

const LOCKED_FEATURES = [
  "Predictive maintenance",
  "Future repair insights",
  "Full diagnostics AI report",
  "Resale value tracking",
  "Smart MOT reminders",
] as const;

type Props = {
  isMember: boolean;
  onUnlock: () => void;
};

export function HeroLockedPremiumCard({ isMember, onUnlock }: Props) {
  if (isMember) {
    return (
      <div className="hero-report-panel w-full">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4a63c]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Full AI report unlocked
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#f5e6b8]/90">
          Member access active — predictive insights and reminders are enabled for this vehicle.
        </p>
      </div>
    );
  }

  return (
    <div className="hero-report-panel relative w-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[#080706]/55 backdrop-blur-[2px]"
        aria-hidden
      />
      <div className="relative">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4a63c]">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Unlock full AI vehicle report
        </p>
        <ul className="mt-2.5 space-y-1 blur-[3px] select-none">
          {LOCKED_FEATURES.map((f) => (
            <li key={f} className="text-[10px] text-zinc-400">
              · {f}
            </li>
          ))}
        </ul>
        <div className="relative mt-3 border border-[#d4a63c]/35 bg-black/60 px-3 py-2.5 text-center">
          <p className="text-[11px] font-semibold text-white">From {PREMIUM_MEMBERSHIP_FROM}</p>
          <p className="mt-0.5 text-[10px] text-zinc-500">Cancel anytime · Instant access</p>
          <button
            type="button"
            onClick={onUnlock}
            className="btn-glow mt-2.5 flex w-full min-h-[36px] items-center justify-center rounded-lg text-[11px] font-bold text-black"
          >
            Unlock premium insights
          </button>
        </div>
      </div>
    </div>
  );
}
