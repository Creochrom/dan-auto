"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeroBrandLogo } from "@/components/hero/HeroBrandLogos";
import { HeroDragScroll } from "@/components/hero/HeroDragScroll";
import { HERO_BRANDS } from "@/lib/hero-content";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  variant?: "ribbon" | "compact";
};

export function HeroBrandStrip({ variant = "ribbon" }: Props) {
  const reduceMotion = useReducedMotion();
  const isRibbon = variant === "ribbon";

  return (
    <div className={isRibbon ? "hero-brand-ribbon" : "hero-brand-cluster"}>
      <p className="hero-brand-ribbon__label">Trusted by drivers of</p>
      <HeroDragScroll
        aria-label="Brand logos"
        centerOnDesktop={isRibbon}
        trackClassName="hero-ribbon-track hero-brand-track"
      >
        {HERO_BRANDS.map((brand, i) => (
          <motion.div
            key={brand.id}
            role="listitem"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduceMotion ? 0 : 0.02 + i * 0.015,
              duration: 0.35,
              ease: EASE,
            }}
            className={`hero-brand-float shrink-0 snap-center ${
              brand.id === "mercedes" || brand.id === "land-rover" || brand.id === "volkswagen"
                ? "hero-brand-float--wide"
                : ""
            }`}
          >
            <HeroBrandLogo brand={brand.id} className="hero-brand-float__svg" />
          </motion.div>
        ))}
      </HeroDragScroll>
    </div>
  );
}
