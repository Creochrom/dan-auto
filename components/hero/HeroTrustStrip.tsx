"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HeroTrustBadge } from "@/lib/hero-content";
import { HeroDragScroll } from "@/components/hero/HeroDragScroll";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  badges: readonly HeroTrustBadge[];
  variant?: "ribbon" | "compact";
};

export function HeroTrustStrip({ badges, variant = "ribbon" }: Props) {
  const reduceMotion = useReducedMotion();
  const isRibbon = variant === "ribbon";

  return (
    <HeroDragScroll
      aria-label="Trust badges"
      centerOnDesktop={isRibbon}
      trackClassName={`hero-ribbon-track hero-trust-track ${isRibbon ? "hero-trust-track--ribbon" : ""}`}
    >
      {badges.map((badge, i) => (
        <motion.div
          key={`${badge.primary}-${badge.secondary}`}
          role="listitem"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 0.02 + i * 0.02,
            duration: 0.35,
            ease: EASE,
          }}
          className={
            isRibbon
              ? "hero-trust-card shrink-0 snap-center"
              : "hero-trust-badge hero-trust-badge--compact shrink-0 snap-start"
          }
        >
          <span
            className={
              isRibbon ? "hero-trust-card__icon" : "hero-trust-icon-wrap hero-trust-icon-wrap--compact"
            }
            aria-hidden
          >
            <badge.icon
              className={`hero-trust-icon ${isRibbon ? "hero-trust-card__icon-svg" : "h-3.5 w-3.5"}`}
            />
          </span>
          <span className={isRibbon ? "hero-trust-card__text" : "hero-trust-badge__text"}>
            <span className={isRibbon ? "hero-trust-card__primary" : "hero-trust-badge__primary"}>
              {badge.primary}
            </span>
            <span
              className={isRibbon ? "hero-trust-card__secondary" : "hero-trust-badge__secondary"}
            >
              {badge.secondary}
            </span>
          </span>
        </motion.div>
      ))}
    </HeroDragScroll>
  );
}
