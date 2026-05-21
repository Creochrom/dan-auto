"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import { HeroBookingOffer } from "@/components/hero/report/HeroBookingOffer";
import { VehicleHeroImage } from "@/components/hero/report/VehicleHeroImage";

type Props = {
  report: VehicleReport;
  isMember: boolean;
  onBook: () => void;
  onDiscussAI: () => void;
};

export function HeroVehicleFoundCard({ report, isMember, onBook, onDiscussAI }: Props) {
  const reduceMotion = useReducedMotion();
  const { profile } = report;

  return (
    <div className="hero-report-panel pointer-events-auto w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <motion.span
            initial={reduceMotion ? {} : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.08 }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
          </motion.span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#d4a63c]">
              Your vehicle found
            </p>
            <p className="font-mono text-[10px] text-zinc-500">{report.reg}</p>
          </div>
        </div>
        {report.matched && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-200/90">
            DVLA match
          </span>
        )}
      </div>

      <div className="hero-report-media relative -mx-4 mt-3 overflow-hidden border-y border-white/[0.06]">
        <VehicleHeroImage
          makeModel={profile.makeModel}
          unknown={report.unknown}
          heightClass="h-[96px]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      <h3 className="mt-3 text-[16px] font-semibold leading-tight text-white">
        {profile.makeModel}
      </h3>
      <p className="mt-1 text-[11px] text-zinc-400">
        {profile.year} · {profile.fuel} · {profile.engine}
      </p>

      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
        <div className="border border-white/[0.06] bg-black/45 px-2 py-1.5">
          <span className="block text-zinc-500">MOT</span>
          <span className="font-medium text-zinc-200">{profile.motStatus}</span>
        </div>
        <div className="border border-white/[0.06] bg-black/45 px-2 py-1.5">
          <span className="block text-zinc-500">Tax</span>
          <span className="font-medium text-zinc-200">{profile.taxStatus}</span>
        </div>
      </div>

      <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#d4a63c]" aria-hidden />
        {report.aiSummary}
      </p>

      <HeroBookingOffer isMember={isMember} className="mt-3" onBook={onBook} />

      <button
        type="button"
        onClick={onDiscussAI}
        className="mt-2 flex w-full min-h-[36px] items-center justify-center border border-[#d4a63c]/28 bg-black/50 text-[11px] font-semibold text-white/90 transition hover:border-[#d4a63c]/45 hover:bg-[#d4a63c]/8"
      >
        Discuss with AI assistant
      </button>
    </div>
  );
}
