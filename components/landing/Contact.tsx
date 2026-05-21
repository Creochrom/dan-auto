"use client";

import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const contactItems = [
  {
    icon: MapPin,
    label: "Visit us",
    value: "Unit 4, Riverside Trade Park\nManchester, M50 3XP",
  },
  {
    icon: Phone,
    label: "Call",
    value: "01234 567 890",
    href: "tel:+441234567890",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@danaauto.co.uk",
    href: "mailto:hello@danaauto.co.uk",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon–Fri 8:00–18:00\nSat 9:00–14:00",
  },
];

export function Contact() {
  return (
    <section id="contact" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Contact"
          title="We're on your route."
          description="Drop in, call ahead, or message us — same premium experience every channel."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-white/8 bg-surface p-6"
            >
              <item.icon className="h-5 w-5 text-cyan" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  className="mt-2 block whitespace-pre-line text-sm text-white transition hover:text-cyan"
                >
                  {item.value}
                </a>
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm text-white">
                  {item.value}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50"
        >
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900 md:h-64">
            <p className="text-sm text-zinc-500">
              Map embed · Manchester Riverside Trade Park
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
