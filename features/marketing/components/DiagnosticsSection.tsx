"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, Gauge } from "lucide-react";
import { BUSINESS } from "@/lib/config";

type DiagnosticsSectionProps = {
  sectionGlow?: React.ReactNode;
  phoneHref: string;
  onBookDiagnostics: () => void;
  onAskWarningLight: () => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function DiagnosticsSection({
  sectionGlow,
  phoneHref,
  onBookDiagnostics,
  onAskWarningLight,
}: DiagnosticsSectionProps) {
  return (
    <section id="diagnostics" className="section-future relative scroll-mt-nav py-20 sm:py-28">
      {sectionGlow}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div className="premium-panel overflow-hidden rounded-3xl">
          <div className="grid lg:grid-cols-2">
            <div className="relative border-b border-white/8 p-8 sm:p-12 lg:border-b-0 lg:border-r">
              <p className="eyebrow-diagnostic">Diagnostics</p>
              <h2 className="display-section mt-4 text-white">Check engine light on?</h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-400">
                Speak to our diagnostics team at{" "}
                <a href={phoneHref} className="font-medium text-cyan hover:underline">
                  {BUSINESS.phone}
                </a>
                . With {BUSINESS.experience} years of experience, we diagnose faults on all makes -
                warning lights to complex engine and emissions issues.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onBookDiagnostics}
                  className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black"
                >
                  Book diagnostics
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onAskWarningLight}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/8 px-6 py-3 text-sm font-semibold text-[#e8d5a3] transition hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/12"
                >
                  <Bot className="h-4 w-4" />
                  Ask about a warning light
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <ul className="space-y-4 text-sm text-zinc-300">
                {[
                  "OBD fault code reading & live data",
                  "EGR, DPF & emissions faults",
                  "Engine, gearbox & electrical tracing",
                  "Written report - no jargon",
                  "German & performance marques welcome",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
