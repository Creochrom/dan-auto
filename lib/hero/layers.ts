/**
 * Hero layer system — z-index tokens and semantic layer ids.
 *
 * Layers are documented in docs/HERO_ARCHITECTURE.md.
 * CSS custom properties (--hero-z-*) are the single source of truth for paint order.
 */

export const HERO_LAYER = {
  /** Layer 0 — cinematic vehicle image column */
  background: "background",
  /** Layer 1 — vignettes, gradients, readability overlays */
  gradient: "gradient",
  /** Layer 2 — copy, plate input, vehicle info cards in flow */
  content: "content",
  /** Layer 3 — trust / membership ribbons (document flow below viewport) */
  ribbons: "ribbons",
  /** Layer 4 — draggable floating windows (lookup, report suite, chat) */
  cards: "cards",
  /** Layer 5 — estimate / inspection panels and future service drawers */
  panels: "panels",
  /** Layer 6 — reserved for future full-screen hero modals */
  modals: "modals",
} as const;

export type HeroLayerId = (typeof HERO_LAYER)[keyof typeof HERO_LAYER];

/** CSS variable names — keep in sync with :root in globals.css */
export const HERO_Z_INDEX_VAR = {
  background: "--hero-z-bg",
  gradient: "--hero-z-gradient",
  content: "--hero-z-content",
  fade: "--hero-z-fade",
  ribbons: "--hero-z-ribbons",
  cards: "--hero-z-cards",
  panels: "--hero-z-panels",
  modals: "--hero-z-modals",
} as const;
