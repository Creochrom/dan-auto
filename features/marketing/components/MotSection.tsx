"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Check, ClipboardCheck, Clock, X } from "lucide-react";
import { motPolicy, openingHours } from "@/lib/config";

const EASE = [0.22, 1, 0.36, 1] as const;

const HOURS_ROWS = [
  { label: openingHours.weekdays.label, value: openingHours.weekdays.hours },
  { label: openingHours.saturday.label, value: openingHours.saturday.hours },
  { label: openingHours.sunday.label, value: openingHours.sunday.hours },
] as const;

type Props = {
  onBookMot: () => void;
  onAskAdvisor: () => void;
};

export function MotSection({ onBookMot, onAskAdvisor }: Props) {
  return (
    <section id="mot" className="section-future relative scroll-mt-nav py-20 sm:py-24 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(201,162,39,0.08),transparent)]"
        aria-hidden
      />
      <motion.div
        className="relative mx-auto grid max-w-6xl items-start gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-10 md:items-center lg:gap-12 xl:max-w-6xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-col gap-6 sm:gap-7"
        >
          <div>
            <p className="eyebrow">MOT testing</p>
            <h2 className="display-section mt-4 text-white">
              Pass your MOT with confidence
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Comprehensive MOT testing at our Southampton workshop — clear
              advisories, pre-checks available, and same-day booking confirmation
              when you reserve online.
            </p>
          </div>

          <div className="rounded-2xl border border-[#d4a63c]/20 bg-black/40 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4a63c]">
              {motPolicy.title}
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Pre-MOT checks available",
                ...motPolicy.eligible,
                "Clear advisories explained",
                "Retest support if required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a63c]" aria-hidden />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
              {motPolicy.notEligible.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-500"
                >
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">
                Not sure if your vehicle qualifies?
              </p>
              <button
                type="button"
                onClick={onAskAdvisor}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d4a63c]/30 bg-[#d4a63c]/[0.06] px-4 py-2 text-xs font-semibold text-[#e8d4a8] transition hover:border-[#d4a63c]/50 hover:bg-[#d4a63c]/12"
              >
                <Bot className="h-3.5 w-3.5 text-[#d4a63c]" aria-hidden />
                Ask service advisor
              </button>
            </div>
          </div>

          <div className="mot-hours-card rounded-2xl border border-white/[0.08] bg-black/35 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#d4a63c]">
              <Clock className="h-4 w-4" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Opening hours
              </p>
            </div>
            <dl className="mt-4 space-y-3">
              {HOURS_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-sm font-medium text-zinc-300">{row.label}</dt>
                  <dd
                    className={`text-sm tabular-nums ${
                      row.value === "Closed"
                        ? "text-zinc-500"
                        : "font-medium text-[#f5e6b8]"
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <button
            type="button"
            onClick={onBookMot}
            className="btn-glow inline-flex w-fit items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-black"
          >
            Book MOT online
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
          className="premium-card flex flex-col rounded-3xl p-7 sm:p-9 md:sticky md:top-28 lg:p-10"
        >
          <ClipboardCheck className="h-10 w-10 text-[#d4a63c]" aria-hidden />
          <p className="mt-6 text-3xl font-light tracking-tight text-white">
            From £54.85
          </p>
          <p className="mt-2 text-sm text-zinc-500">Maximum MOT test fee</p>
          <p className="mt-8 flex-1 border-t border-white/10 pt-6 text-sm leading-relaxed text-zinc-400">
            Combine your MOT with an oil change or service when you book — our
            team will recommend the most efficient package for your vehicle.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-zinc-600">
            {openingHours.saturday.note}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
