"use client";

import type { ReactNode, RefObject } from "react";

type Props = {
  /** Layer 0–2 — background, gradients, hero copy and plate */
  hero: ReactNode;
  /** Layer 4–5 — floating windows and overlay panels (absolute over viewport) */
  interactive?: ReactNode;
  /** Ref on `.hero-interactive-root` — drag bounds for windows/panels */
  interactiveRef?: RefObject<HTMLDivElement | null>;
  /** Layer 3 — trust ribbons below the viewport stage */
  ribbons: ReactNode;
};

/**
 * First-viewport shell: navbar clearance + flex hero viewport + anchored ribbons.
 * Interactive UI is a sibling of `section.hero` inside `.hero-viewport` so panels
 * can paint above ribbons without being trapped in the hero stacking subtree.
 */
export function HeroLandingShell({
  hero,
  interactive,
  interactiveRef,
  ribbons,
}: Props) {
  return (
    <div className="hero-landing" data-hero-root>
      <div className="hero-viewport" data-hero-layer="viewport">
        {hero}
        {interactive ? (
          <div
            ref={interactiveRef}
            className="hero-interactive-root"
            data-hero-layer="interactive"
          >
            {interactive}
          </div>
        ) : null}
      </div>
      {ribbons}
    </div>
  );
}
