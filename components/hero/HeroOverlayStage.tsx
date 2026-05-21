"use client";

import type { ReactNode } from "react";

type HeroOverlayStageProps = {
  active: boolean;
  children: ReactNode;
};

/**
 * Full-hero overlay surface (headline → trust row). Absolute positioning keeps
 * windows out of document flow while matching the composition bounds for drag.
 */
export function HeroOverlayStage({ active, children }: HeroOverlayStageProps) {
  if (!active) return null;

  return (
    <div className="hero-overlay-stage" aria-live="polite">
      {children}
    </div>
  );
}
