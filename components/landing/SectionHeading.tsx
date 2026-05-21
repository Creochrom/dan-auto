"use client";

import { motion } from "framer-motion";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}
    >
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-cyan">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-light tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-zinc-400 md:text-lg">{description}</p>
      )}
    </motion.div>
  );
}
