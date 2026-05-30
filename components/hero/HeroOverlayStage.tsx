"use client";

import type { ReactNode } from "react";

type HeroOverlayStageProps = {
  active: boolean;
  children: ReactNode;
};

/**
 * Full-hero overlay surface for modals. Absolute positioning keeps
 * windows out of document flow while matching the composition bounds for drag.
 */
export function HeroOverlayStage({ active, children }: HeroOverlayStageProps) {
  if (!active) return null;

  return (
    <div
      className="hero-overlay-stage"
      data-hero-layer="panels"
      aria-live="polite"
    >
      {children}
    </div>
  );
}
