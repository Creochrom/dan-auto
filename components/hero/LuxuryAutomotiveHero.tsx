"use client";

/**
 * Luxury automotive workshop hero — blueprint composition.
 * Production page uses `PremiumHero` with live booking/lookup state from `app/page.tsx`.
 * This module exports blueprint defaults for Storybook-style reuse or tests.
 */

export { PremiumHero as LuxuryAutomotiveHero } from "@/components/hero/PremiumHero";

export const HERO_BLUEPRINT_DEFAULTS = {
  badge: "SOUTHAMPTON'S TRUSTED CAR SPECIALISTS",
  phone: "023 8023 3552",
  phoneHref: "tel:02380233552",
  experience: "25+",
  googleRating: "4.9",
  googleReviewCount: "1000",
  defaultPlate: "WP56 YAD",
} as const;
