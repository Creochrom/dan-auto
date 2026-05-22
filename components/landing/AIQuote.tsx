"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { UKPlateInput } from "./UKPlateInput";
import { SectionHeading } from "./SectionHeading";

const serviceOptions = [
  "Full service & MOT",
  "Diagnostics",
  "Brakes",
  "Detailing",
  "EV / Hybrid care",
];

function mockQuote(reg: string, service: string): string {
  const base = 120 + reg.length * 8 + service.length * 3;
  const low = base;
  const high = base + 85;
  return `Estimated for **${reg}** · ${service}\n\nLabour & parts: **£${low} – £${high}**\n\nIncludes digital inspection report, fluid top-up, and 12-month workmanship warranty. Final price confirmed after physical assessment.`;
}

export function AIQuote() {
  const [reg, setReg] = useState("");
  const [service, setService] = useState(serviceOptions[0]);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [displayed, setDisplayed] = useState("");

  const generate = () => {
    if (reg.length < 2) return;
    setLoading(true);
    setQuote(null);
    setDisplayed("");
    setTimeout(() => {
      const text = mockQuote(reg, service);
      setQuote(text);
      setLoading(false);
    }, 1400);
  };

  useEffect(() => {
    if (!quote) return;
    let i = 0;
    const plain = quote.replace(/\*\*/g, "");
    const id = setInterval(() => {
      i += 2;
      setDisplayed(plain.slice(0, i));
      if (i >= plain.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [quote]);

  return (
    <section id="ai-quote" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan/[0.04] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="AI Quote"
          title="Instant estimates. Zero phone tag."
          description="Our AI assistant analyses your registration and service selection to produce a transparent ballpark quote in seconds."
          align="center"
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-14 max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-surface-elevated glow-cyan"
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dan Auto Centre assistant</p>
              <p className="text-xs text-zinc-500">Powered by workshop data · Updated live</p>
            </div>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Online
            </span>
          </div>

          <div className="space-y-5 p-5 md:p-8">
            <UKPlateInput value={reg} onChange={setReg} onLookup={generate} />

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-500">
                Service type
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30"
              >
                {serviceOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-zinc-900">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={loading || reg.length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan py-3.5 text-sm font-medium text-black transition hover:bg-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing vehicle data…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI quote
                </>
              )}
            </button>

            <AnimatePresence mode="wait">
              {(loading || displayed) && (
                <motion.div
                  key={loading ? "load" : "quote"}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/8 bg-black/50 p-4"
                >
                  {loading ? (
                    <div className="flex gap-2">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="h-2 w-2 rounded-full bg-cyan/60"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: d * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="whitespace-pre-line font-mono text-sm leading-relaxed text-zinc-300">
                      {displayed}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="ml-0.5 inline-block h-4 w-0.5 bg-cyan align-middle"
                      />
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
