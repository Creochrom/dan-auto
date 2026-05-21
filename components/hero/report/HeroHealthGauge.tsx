"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { VehicleHealthScore } from "@/lib/types/vehicle-report";

const TONE_RING: Record<VehicleHealthScore["tone"], string> = {
  excellent: "#22c55e",
  good: "#d4a63c",
  attention: "#f59e0b",
  critical: "#ef4444",
};

type Props = {
  health: VehicleHealthScore;
};

export function HeroHealthGauge({ health }: Props) {
  const reduceMotion = useReducedMotion();
  const pct = health.score / 100;
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const ring = TONE_RING[health.tone];

  return (
    <div className="hero-report-panel flex flex-col items-center gap-3 py-1">
      <div className="relative h-[108px] w-[108px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 12px ${ring}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold leading-none text-white">
            {health.score > 0 ? health.score : "—"}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            / 100
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d4a63c]">
          Vehicle health score
        </p>
        <p className="mt-1 text-[12px] font-semibold text-white">{health.label}</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{health.explanation}</p>
      </div>
    </div>
  );
}
