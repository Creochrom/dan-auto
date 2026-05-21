"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/lib/landing-data";
import { SectionHeading } from "./SectionHeading";

export function Services() {
  return (
    <section id="services" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Services"
          title="Everything your vehicle needs, under one roof."
          description="From daily drivers to performance EVs — transparent pricing, OEM-grade parts, and digital updates at every stage."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-surface p-6 transition-colors hover:border-cyan/30"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan/5 blur-2xl transition group-hover:bg-cyan/15" />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan/10 text-cyan ring-1 ring-cyan/20">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-white">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {service.description}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    From{" "}
                    <span className="font-medium text-cyan">{service.from}</span>
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition group-hover:border-cyan/40 group-hover:text-cyan">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
