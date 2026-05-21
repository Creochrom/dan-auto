"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HeroTrustBadge } from "@/lib/hero-content";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  badges: readonly HeroTrustBadge[];
};

export function HeroTrustStrip({ badges }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hero-trust-strip w-full">
      <div className="hero-trust-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:snap-none [&::-webkit-scrollbar]:hidden">
        {badges.map((badge, i) => (
          <motion.div
            key={`${badge.primary}-${badge.secondary}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.04 + i * 0.03, duration: 0.45, ease: EASE }}
            className="hero-trust-badge group shrink-0 snap-start lg:snap-align-none"
          >
            <span className="hero-trust-icon-wrap" aria-hidden>
              <badge.icon className="hero-trust-icon h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#d4a63c] sm:text-xs">
                {badge.primary}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-300 sm:text-[11px]">
                {badge.secondary}
              </span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
