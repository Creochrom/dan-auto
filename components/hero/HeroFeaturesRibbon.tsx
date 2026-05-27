"use client";

import type { HeroTrustBadge } from "@/lib/hero-content";
import { HeroDragScroll } from "@/components/hero/HeroDragScroll";

type Props = {
  badges: readonly HeroTrustBadge[];
};

function displayTitle(badge: HeroTrustBadge): string {
  if (badge.secondary === "Google Rating") {
    return `${badge.primary} ★`;
  }
  return badge.primary;
}

export function HeroFeaturesRibbon({ badges }: Props) {
  return (
    <div
      className="border-b border-white/[0.06] bg-gradient-to-b from-[#101010] to-[#0b0b0b]"
      aria-label="Workshop credentials"
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <HeroDragScroll
          aria-label="Workshop credentials"
          trackClassName="hero-ribbon-features-track items-stretch"
        >
          <div className="hero-ribbon-features-row flex min-w-max flex-1 divide-x divide-white/[0.06]">
            {badges.map((badge) => (
              <div
                key={`${badge.primary}-${badge.secondary}`}
                role="listitem"
                className="hero-ribbon-feature-item flex min-w-0 flex-1 items-center justify-center gap-3 px-2 sm:px-3"
              >
                <badge.icon
                  className="h-[21px] w-[21px] shrink-0 stroke-[1.5] text-[#d4a63a]"
                  aria-hidden="true"
                />
                <span className="hero-ribbon-feature-item__text flex min-w-0 flex-col gap-0.5 leading-none">
                  <span className="hero-ribbon-feature-item__label whitespace-nowrap text-[15px] font-semibold tracking-tight text-[#d4a63a]">
                    {displayTitle(badge)}
                  </span>
                  <span className="hero-ribbon-feature-item__sublabel whitespace-nowrap text-[10px] font-medium uppercase leading-tight tracking-[0.08em] text-white/[0.68]">
                    {badge.secondary.toUpperCase()}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </HeroDragScroll>
      </div>
    </div>
  );
}
