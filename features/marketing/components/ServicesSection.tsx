"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BookingCTAStrip } from "@/features/marketing/components/BookingCTAStrip";
import { ServiceGridPremium } from "@/components/services/ServiceGridPremium";
import { siteServices } from "@/lib/config";

const EASE = [0.22, 1, 0.36, 1] as const;

const SERVICING_TIERS = [
  {
    name: "Basic service",
    description: "Essential checks and oil change to keep your car running smoothly.",
  },
  {
    name: "Full service",
    description:
      "Comprehensive check including fluid top-ups and filter replacements.",
  },
  {
    name: "Major service",
    description:
      "Thorough maintenance covering safety, fluids, filters, and wear items.",
  },
] as const;

type Props = {
  onBook: () => void;
  onBookService: (serviceLabel: string) => void;
  sectionGlow: ReactNode;
};

export function ServicesSection({ onBook, onBookService, sectionGlow }: Props) {
  return (
    <section
      id="services"
      className="section-deep relative scroll-mt-nav py-24 sm:py-32"
    >
      {sectionGlow}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: EASE }}
          className="max-w-2xl"
        >
          <p className="eyebrow">Vehicle repair services</p>
          <h2 className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Everything your car needs in Southampton
          </h2>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Top-notch automotive services to keep your vehicle running smoothly.
            Experienced technicians, competitive pricing, and professional friendly
            service — your car is in safe hands.
          </p>
        </motion.div>

        <ServiceGridPremium
          services={siteServices}
          onBookService={onBookService}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14"
        >
          <p className="eyebrow">Servicing packages</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {SERVICING_TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="premium-card rounded-2xl p-5 sm:p-6"
              >
                <h3 className="text-base font-medium text-white">{tier.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {tier.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <BookingCTAStrip className="mt-12" onBook={onBook} />
      </div>
    </section>
  );
}
