"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/config";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  onOpenAdvisor: () => void;
  onBook: () => void;
};

export function AdvisorSection({ onOpenAdvisor, onBook }: Props) {
  return (
    <section
      id="ai-advisor"
      className="section-future relative scroll-mt-nav py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="premium-panel glow-cyan--active overflow-hidden rounded-3xl border border-[#d4a63c]/22"
        >
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10 lg:p-10">
            <div className="flex gap-4 sm:gap-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d4a63c]/15 ring-1 ring-[#d4a63c]/30">
                <Bot className="h-6 w-6 text-[#d4a63c]" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a63c]">
                  AI service advisor
                </p>
                <h2 className="mt-2 text-xl font-medium text-white sm:text-2xl">
                  Not sure what&apos;s wrong with your car?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Describe symptoms, warning lights, or noises — our digital
                  advisor asks focused questions, suggests possible causes, and
                  prepares clear notes for {BRAND.shortName} technicians. Indicative
                  guidance only; a mechanic confirms after inspection.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:min-w-[200px]">
              <button
                type="button"
                onClick={onOpenAdvisor}
                className="btn-glow inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-black"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Open service advisor
              </button>
              <button
                type="button"
                onClick={onBook}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-[#d4a63c]/35 hover:text-[#f5e6b8]"
              >
                Book your visit
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
