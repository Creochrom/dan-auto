"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { reviews } from "@/lib/landing-data";
import { SectionHeading } from "./SectionHeading";

export function Reviews() {
  return (
    <section id="reviews" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Reviews"
          title="Trusted by drivers who expect more."
          description="Real feedback from local owners who chose premium care over the usual garage experience."
          align="center"
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {reviews.map((review, i) => (
            <motion.blockquote
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-surface p-6 md:p-8"
            >
              <div className="flex gap-1">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-cyan text-cyan"
                  />
                ))}
              </div>
              <p className="mt-4 text-base leading-relaxed text-zinc-300">
                &ldquo;{review.text}&rdquo;
              </p>
              <footer className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
                <div>
                  <cite className="not-italic font-medium text-white">
                    {review.name}
                  </cite>
                  <p className="text-xs text-zinc-500">{review.vehicle}</p>
                </div>
                <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs text-cyan">
                  Verified
                </span>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
