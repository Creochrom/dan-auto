"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { UKPlateInput } from "./UKPlateInput";

const stats = [
  { value: "4.9", label: "Google rating" },
  { value: "12k+", label: "Vehicles serviced" },
  { value: "Same day", label: "MOT slots" },
];

export function Hero() {
  const [plate, setPlate] = useState("");
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  const handleLookup = (reg: string) => {
    setLookupMsg(
      `Vehicle ${reg} found — scroll to AI Quote for an instant estimate.`
    );
    document.getElementById("ai-quote")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[100dvh] overflow-hidden pt-28 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/15 blur-[120px]" />
      <motion.div
        className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-amber-600/8 blur-[80px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/5 px-4 py-1.5 text-xs text-cyan"
        >
          <Zap className="h-3.5 w-3.5" />
          <span className="tracking-wide">EV-ready · IMI Level 3 · DVSA approved</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-4xl font-light leading-[1.08] tracking-tight text-white sm:text-5xl md:text-7xl"
        >
          Automotive care,{" "}
          <span className="glow-text font-medium text-cyan">reimagined</span> for
          the modern driver.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-xl text-base text-zinc-400 md:text-lg"
        >
          Dan Auto Centre delivers Tesla-grade transparency — instant reg lookup,
          AI-powered quotes, and concierge booking from your phone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 max-w-lg"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Enter your UK registration
          </p>
          <UKPlateInput
            value={plate}
            onChange={setPlate}
            onLookup={handleLookup}
          />
          {lookupMsg && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-start gap-2 text-sm text-cyan"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {lookupMsg}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <a
            href="#booking"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Book service
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#ai-quote"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm text-white transition hover:border-cyan/50 hover:text-cyan"
          >
            Get AI quote
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-4 border-t border-white/10 pt-10 md:max-w-xl md:gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <p className="text-2xl font-light text-white md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500 md:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-10 w-6 rounded-full border border-white/20 p-1">
            <motion.div
              className="mx-auto h-2 w-1 rounded-full bg-cyan"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
