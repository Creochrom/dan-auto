"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

export type HeroServiceStripItem = {
  iconSlot?: ReactNode;
  icon?: LucideIcon;
  title: string;
  hint: string;
};

type Props = {
  items: readonly HeroServiceStripItem[];
  onSelect: (label: string) => void;
};

export function HeroServiceStrip({ items, onSelect }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hero-service-strip w-full">
      <div className="hero-service-scroll flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-8 lg:gap-3 lg:overflow-visible lg:snap-none lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <motion.button
            key={item.title}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.05 + i * 0.04, duration: 0.45, ease: EASE }}
            onClick={() => onSelect(item.title)}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            whileTap={{ scale: 0.985 }}
            className="hero-service-chip group shrink-0 snap-start text-left lg:snap-align-none"
          >
            <span className="relative flex h-full flex-col rounded-2xl border border-[#d4a63c]/25 bg-[#060504]/92 p-px shadow-[inset_0_1px_0_rgba(248,228,160,0.12),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300 hover:border-[#d4a63c]/50 hover:shadow-[0_18px_52px_rgba(212,166,60,0.22),inset_0_1px_0_rgba(255,240,196,0.16)]">
              <span className="flex h-[5.75rem] w-[9.75rem] flex-col rounded-[0.9375rem] px-3.5 py-3.5 sm:h-[6.125rem] sm:w-[10.75rem] sm:px-4 sm:py-4 lg:h-[6.5rem] lg:w-full lg:min-w-0">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-black/90 ring-1 ring-[#d4a63c]/35 transition duration-300 group-hover:ring-[#d4a63c]/60">
                  {!reduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(232,197,71,0.25),transparent_55%)] opacity-70"
                      aria-hidden
                      animate={{ opacity: [0.55, 0.95, 0.55] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {item.iconSlot ? (
                    item.iconSlot
                  ) : item.icon ? (
                    <item.icon className="relative z-[1] h-[18px] w-[18px] text-[#d4a63c]" aria-hidden />
                  ) : null}
                </span>
                <span className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-200 sm:text-xs">
                  {item.title}
                </span>
                <span className="mt-auto text-[11px] font-semibold text-[#d4a63c] sm:text-xs">
                  {item.hint}
                </span>
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
