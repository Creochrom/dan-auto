"use client";

import type { HeroTrustBadge } from "@/lib/hero-content";
import { HeroFeaturesRibbon } from "@/components/hero/HeroFeaturesRibbon";
import { HeroMembershipRibbon } from "@/components/hero/HeroMembershipRibbon";

type Props = {
  badges: readonly HeroTrustBadge[];
  onCreateAccount: () => void;
};

/** Premium trust ribbons — document flow below the hero visual. */
export function HeroPremiumInfoStrip({ badges, onCreateAccount }: Props) {
  return (
    <aside
      className="hero-info-ribbons w-full"
      aria-label="Workshop trust badges and supported brands"
    >
      <HeroFeaturesRibbon badges={badges} />
      <HeroMembershipRibbon onCreateAccount={onCreateAccount} />
    </aside>
  );
}
