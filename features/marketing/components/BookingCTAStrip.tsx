"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

type Props = {
  title?: string;
  subtitle?: string;
  onBook: () => void;
  className?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function BookingCTAStrip({
  title = "Ready to book your visit?",
  subtitle = "MOT, diagnostics, servicing & repairs — online request, confirmed by our team.",
  onBook,
  className = "",
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE }}
      className={`relative overflow-hidden rounded-2xl border border-[#d4a63c]/35 bg-gradient-to-r from-[#d4a63c]/12 via-black/80 to-black/90 px-5 py-6 sm:rounded-3xl sm:px-8 sm:py-7 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 120% at 0% 50%, rgba(212,166,60,0.25), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d4a63c]/20 ring-1 ring-[#d4a63c]/35">
            <Calendar className="h-5 w-5 text-[#d4a63c]" aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold text-white sm:text-lg">{title}</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBook}
          className="btn-glow inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-black sm:w-auto"
        >
          Book your visit
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}
