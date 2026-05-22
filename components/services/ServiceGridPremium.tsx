"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, X, type LucideIcon } from "lucide-react";
import { getServiceDetail } from "@/lib/services-detail";

const EASE = [0.22, 1, 0.36, 1] as const;

export type ServiceItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  from: string;
  duration: string;
  tag?: string;
};

type Props = {
  services: ServiceItem[];
};

export function ServiceGridPremium({ services }: Props) {
  const [active, setActive] = useState<ServiceItem | null>(null);
  const detail = active ? getServiceDetail(active.title) : null;

  return (
    <>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((s, i) => (
          <motion.article
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ delay: i * 0.04, duration: 0.45, ease: EASE }}
            whileHover={{ y: -4 }}
            className="premium-card group relative cursor-pointer overflow-hidden rounded-2xl p-6 sm:p-7"
            onClick={() => setActive(s)}
            onKeyDown={(e) => e.key === "Enter" && setActive(s)}
            role="button"
            tabIndex={0}
          >
            {s.tag && (
              <span className="absolute right-5 top-5 z-10 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200 ring-1 ring-amber-500/25">
                {s.tag}
              </span>
            )}
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-500/5 blur-2xl transition group-hover:bg-amber-500/15" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-black/40 text-amber-300 ring-1 ring-amber-500/25">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-medium text-white sm:text-lg">
                {s.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                {s.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5 text-amber-400/80" />
                <span>{s.duration}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-4">
                <span className="text-sm text-zinc-500">
                  From <span className="font-medium text-amber-300">{s.from}</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-amber-400/90 transition group-hover:text-amber-300">
                  Learn more
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {active && detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center bg-black/80 p-4 backdrop-blur-md sm:items-center"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal
            aria-labelledby="service-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="premium-panel glow-cyan max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{detail.title}</p>
                  <h3
                    id="service-modal-title"
                    className="mt-2 text-2xl font-light text-white"
                  >
                    {detail.headline}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    Typical duration: {detail.typicalDuration} · From {active.from}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-full border border-white/10 p-2 text-zinc-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                    How we perform this work
                  </p>
                  <ol className="mt-3 space-y-2">
                    {detail.process.map((step, idx) => (
                      <li
                        key={step}
                        className="flex gap-3 text-sm leading-relaxed text-zinc-300"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-300">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    Why Dan Auto is different
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {detail.whySuperior}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Real workshop example
                  </p>
                  <p className="mt-2 text-sm italic leading-relaxed text-zinc-400">
                    {detail.workshopExample}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#booking"
                  onClick={() => setActive(null)}
                  className="btn-glow rounded-full px-6 py-3 text-sm font-semibold text-black"
                >
                  Book {active.title}
                </a>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="btn-ghost rounded-full px-6 py-3 text-sm text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
