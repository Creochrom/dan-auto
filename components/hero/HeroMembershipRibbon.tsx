"use client";

import { User } from "lucide-react";
import { HeroBrandLogo } from "@/components/hero/HeroBrandLogos";
import { HeroDragScroll } from "@/components/hero/HeroDragScroll";
import { HERO_RIBBON_BRANDS } from "@/lib/hero-content";

type Props = {
  onCreateAccount: () => void;
};

export function HeroMembershipRibbon({ onCreateAccount }: Props) {
  return (
    <div
      className="bg-[#050505] bg-gradient-to-b from-[#0b0b0b] to-[#050505]"
      aria-label="Supported brands and membership"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-9">
        <HeroDragScroll
          aria-label="Supported brands and membership"
          trackClassName="hero-ribbon-membership-track items-center"
        >
          <div className="flex min-w-max items-center gap-8 px-1">
            <div className="flex shrink-0 items-center gap-7">
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-white/[0.55]">
                Trusted by drivers of
              </span>
              <div
                className="flex items-center gap-7"
                role="list"
                aria-label="Brand logos"
              >
                {HERO_RIBBON_BRANDS.map((brand) => (
                  <span key={brand.id} role="listitem" className="flex shrink-0 items-center">
                    <HeroBrandLogo
                      brand={brand.id}
                      className={`hero-ribbon-logo h-7 w-auto transition-opacity duration-200 hover:opacity-100 md:h-8 ${
                        brand.id === "mercedes" || brand.id === "volkswagen"
                          ? "hero-ribbon-logo--wide"
                          : ""
                      }`}
                    />
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-white/[0.45]">
                AND MORE
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-0.5 px-2 text-center md:px-4">
              <span className="text-sm font-medium leading-tight text-white">
                Join our members
              </span>
              <span className="max-w-[16rem] whitespace-nowrap text-xs leading-snug text-white/[0.68] md:max-w-none">
                Get exclusive benefits, priority booking &amp; rewards
              </span>
            </div>

            <button
              type="button"
              onClick={onCreateAccount}
              className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-full border border-[#d4a63a]/55 bg-transparent px-6 text-sm font-medium text-[#d4a63a] transition duration-200 hover:border-[#d4a63a] hover:shadow-[0_0_18px_rgba(212,166,58,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a63a]"
            >
              <User className="h-4 w-4 stroke-[1.75]" aria-hidden="true" />
              Create account
            </button>
          </div>
        </HeroDragScroll>
      </div>
    </div>
  );
}
