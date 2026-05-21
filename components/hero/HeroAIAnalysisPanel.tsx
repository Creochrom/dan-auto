"use client";

import {
  AlertTriangle,
  Bot,
  Calendar,
  Check,
  HelpCircle,
  MessageCircle,
  Receipt,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";

function displayMakeModel(raw: string) {
  let s = raw.trim();
  s = s.replace(/\bBMW\b/i, "BMW");
  s = s.replace(/\b(\d{3})\s*([Dd])\b/g, (_, n: string) => `${n}D`);
  s = s.replace(/\bM\s*SPORT\b/gi, "M Sport");
  return s;
}

function StatusRow({
  Icon,
  tone = "muted",
  text,
}: {
  Icon: LucideIcon;
  tone?: "muted" | "amber" | "gold";
  text: string;
}) {
  const iconClass =
    tone === "gold"
      ? "text-[#d4a63c]"
      : tone === "amber"
        ? "text-[#d4a63c]"
        : "text-[#d4a63c]/80";

  return (
    <div className="flex items-start gap-2.5 py-1">
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconClass}`} aria-hidden />
      <p className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-zinc-200">
        {text}
      </p>
    </div>
  );
}

function GlassAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-h-[36px] items-center justify-center gap-2 rounded-xl border border-[#d4a63c]/22 bg-black/55 px-3 text-[11px] font-semibold text-white/92 shadow-[inset_0_1px_0_rgba(255,248,220,0.05)] transition hover:border-[#d4a63c]/45 hover:bg-[#d4a63c]/8 hover:shadow-[0_0_24px_rgba(212,166,60,0.12)] active:scale-[0.98] sm:min-h-[38px] sm:text-[12px]"
    >
      <Icon className="h-3.5 w-3.5 text-[#d4a63c]" aria-hidden />
      {label}
    </button>
  );
}

type Props = {
  vehicle: VehicleResult;
  matched: boolean;
  onDiscussAI: () => void;
  onEstimateRepair: () => void;
  onBookInspection: () => void;
  onMembershipNote: () => void;
};

export function HeroAIAnalysisPanel({
  vehicle,
  matched,
  onDiscussAI,
  onEstimateRepair,
  onBookInspection,
  onMembershipNote,
}: Props) {
  const isUnknown = vehicle.unknown || !matched;

  const motText = isUnknown ? "MOT status unavailable" : vehicle.motLine;
  const advText = isUnknown
    ? "No advisories on file"
    : `${vehicle.advisories} advisories detected`;
  const recText = isUnknown
    ? "Recommended: Book inspection for ID"
    : vehicle.recommendation.startsWith("Recommended")
      ? vehicle.recommendation
      : `Recommended: ${vehicle.recommendation}`;

  return (
    <aside
      className="hero-ai-panel pointer-events-auto relative flex w-full max-h-full min-h-0 shrink-0 flex-col rounded-[28px] border border-[#d4a63c]/34 bg-[#080706]/86 p-px shadow-[0_16px_44px_rgba(0,0,0,0.58),0_0_32px_rgba(212,166,60,0.14),inset_0_1px_0_rgba(255,248,220,0.08)] backdrop-blur-xl max-lg:rounded-[20px]"
      aria-label="AI vehicle analysis"
      aria-live="polite"
    >
      <div
        data-drag-handle
        className="hero-ai-panel__header flex shrink-0 cursor-grab items-center justify-between gap-2 rounded-t-[27px] border-b border-[#d4a63c]/18 px-4 py-2.5 active:cursor-grabbing max-lg:rounded-t-[19px] max-lg:px-3 max-lg:py-2"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a63c]/14 ring-1 ring-[#d4a63c]/30">
            <Bot className="h-4 w-4 text-[#d4a63c]" aria-hidden />
          </span>
          <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#d4a63c]">
            AI vehicle analysis
          </p>
        </div>
        {!matched && (
          <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/90">
            Unverified
          </span>
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-px rounded-[27px]"
        style={{
          background:
            "linear-gradient(155deg,rgba(212,166,60,0.1) 0%,transparent 40%,transparent 58%,rgba(6,5,4,0.94) 100%)",
        }}
      />
      <div className="hero-ai-panel__body relative min-h-0 flex-1 overflow-y-auto rounded-b-[27px] p-4 pt-3 max-lg:rounded-b-[19px] max-lg:p-3 max-lg:pt-2.5">
        <p className="hero-ai-panel__title text-[17px] font-semibold leading-tight text-white max-lg:text-[15px]">
          {isUnknown ? "Unknown vehicle" : displayMakeModel(vehicle.makeModel)}
        </p>
        <p className="mt-0.5 text-[12px] text-zinc-400">{vehicle.meta}</p>
        <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#d4a63c]/88">
          {vehicle.reg}
        </p>

        <div className="mt-3 space-y-0 border-t border-white/[0.07] pt-2.5">
          <StatusRow
            Icon={isUnknown ? HelpCircle : Calendar}
            text={motText}
            tone="muted"
          />
          <StatusRow Icon={AlertTriangle} text={advText} tone="amber" />
          <StatusRow Icon={Check} text={recText} tone="gold" />
        </div>

        {isUnknown && (
          <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
            Try a demo reg: AB12 CDE, AU14 SLN, ME20 AMG, or VW18 GTD.
          </p>
        )}

        <div className="hero-ai-panel__actions mt-3 flex flex-col gap-1.5 max-lg:mt-2.5">
          <GlassAction icon={MessageCircle} label="Discuss with AI" onClick={onDiscussAI} />
          <GlassAction icon={Receipt} label="Estimate repair cost" onClick={onEstimateRepair} />
          <button
            type="button"
            onClick={onBookInspection}
            className="btn-glow flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-black active:scale-[0.98] max-lg:min-h-[36px] max-lg:text-[11px]"
          >
            <Wrench className="h-3.5 w-3.5" aria-hidden />
            Book inspection
          </button>
        </div>

        <button
          type="button"
          onClick={onMembershipNote}
          className="mt-3 w-full text-left text-[10px] leading-relaxed text-[#d4a63c]/55 transition hover:text-[#d4a63c]/75"
        >
          Unlock full AI diagnostics and predictive maintenance insights with membership.
        </button>
      </div>
    </aside>
  );
}
