"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Film,
  Gauge,
  Headphones,
  Sparkles,
  Zap,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const VIP_PERKS = [
  { icon: Zap, label: "Priority workshop queue" },
  { icon: Film, label: "Photo & video repair reports" },
  { icon: Gauge, label: "Extended diagnostics insights" },
  { icon: Headphones, label: "Premium support line" },
  { icon: Sparkles, label: "VIP-only discounts" },
  { icon: Crown, label: "Faster turnaround targets" },
] as const;

export function VipMembership() {
  return (
    <section className="relative border-y border-amber-500/10 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(201,162,39,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <p className="eyebrow">VIP membership</p>
            <h2 className="display-section mt-4 text-white">
              Workshop intelligence,{" "}
              <span className="text-gradient font-medium">elevated</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
              Subscribe for monthly priority access, rich media updates from the ramp,
              and the fastest path through MOT, diagnostics, and complex repairs —
              built for drivers who treat their car like an investment.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {VIP_PERKS.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center gap-2 text-sm text-zinc-300"
                >
                  <p.icon className="h-4 w-4 shrink-0 text-amber-400" />
                  {p.label}
                </li>
              ))}
            </ul>
            <a
              href="#platform"
              className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-black"
            >
              <Crown className="h-4 w-4" />
              Join via member hub
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="premium-panel relative overflow-hidden rounded-3xl p-8 sm:p-10"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />
            <Crown className="relative h-12 w-12 text-amber-400" />
            <p className="relative mt-6 text-3xl font-light text-white">
              From <span className="text-amber-300">£19.99</span>
              <span className="text-lg text-zinc-500">/month</span>
            </p>
            <p className="relative mt-2 text-sm text-zinc-400">
              Demo pricing — configure in admin when live billing launches.
            </p>
            <div className="relative mt-8 space-y-3 border-t border-white/10 pt-6 text-sm text-zinc-400">
              <p>
                <span className="text-amber-300">Completion video</span> — e.g.
                &quot;Your repair is complete. Watch your engine startup video.&quot;
              </p>
              <p>Quote approval, instalment requests, and live status in one portal.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
