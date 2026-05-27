"use client";

import type { ReactNode } from "react";

type Props = {
  hero: ReactNode;
  ribbons: ReactNode;
};

/** First-viewport shell: navbar clearance + flex hero + anchored ribbons. */
export function HeroLandingShell({ hero, ribbons }: Props) {
  return (
    <div className="hero-landing">
      {hero}
      {ribbons}
    </div>
  );
}
