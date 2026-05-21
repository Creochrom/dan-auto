"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { MEMBER_BENEFITS } from "./benefits-data";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CustomerBenefits({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <section className="section-deep relative py-24 sm:py-32">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(201,162,39,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow">Member platform</p>
          <h2 className="display-section mt-4 text-white">
            Your garage account,{" "}
            <span className="text-gradient glow-text font-medium">upgraded</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Create a free Dan Auto account for live repair tracking, MOT reminders,
            AI maintenance insights, referral rewards, and faster bookings — built
            for drivers who expect more than a one-off visit.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MEMBER_BENEFITS.map((b, i) => (
            <motion.article
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ delay: (i % 6) * 0.04, duration: 0.45, ease: EASE }}
              whileHover={{ y: -4 }}
              className="premium-card group relative overflow-hidden rounded-2xl p-6"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan/10 blur-2xl transition group-hover:bg-cyan/20" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/5 text-amber-300 ring-1 ring-amber-500/25 transition group-hover:shadow-[0_0_28px_rgba(201,162,39,0.22)]">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-4 text-base font-medium text-white">{b.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-zinc-400">
                {b.description}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button
            type="button"
            onClick={onCreateAccount}
            className="btn-glow inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-black"
          >
            <Sparkles className="h-4 w-4" />
            Create free account
          </button>
          <a
            href="#platform"
            className="btn-ghost inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white"
          >
            Open member hub
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
