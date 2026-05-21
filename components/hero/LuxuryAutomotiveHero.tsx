"use client";

/**
 * Luxury automotive workshop hero — blueprint composition.
 * Production page uses `PremiumHero` with live booking/lookup state from `app/page.tsx`.
 * This module exports blueprint defaults for Storybook-style reuse or tests.
 */

import { businessConfig } from "@/lib/config/business";

export { PremiumHero as LuxuryAutomotiveHero } from "@/components/hero/PremiumHero";

export const HERO_BLUEPRINT_DEFAULTS = {
  badge: "SOUTHAMPTON'S TRUSTED CAR SPECIALISTS",
  phone: businessConfig.phone.display,
  phoneHref: businessConfig.phone.telHref,
  experience: "25+",
  googleRating: "4.9",
  googleReviewCount: "1000",
  defaultPlate: "WP56 YAD",
} as const;
