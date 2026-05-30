"use client";

import { useCookieConsentOptional } from "@/components/compliance/CookieConsentProvider";

export function HeroPrivacyTrustBlock() {
  const { openPrivacyPolicy } = useCookieConsentOptional();

  return (
    <div
      className="hero-ribbon-privacy flex shrink-0 flex-col items-center justify-center gap-0.5 px-2 text-center max-md:inline-flex max-md:flex-row max-md:flex-nowrap max-md:items-baseline max-md:justify-center max-md:gap-x-1.5 md:px-4"
      aria-label="Privacy and data use"
    >
      <span className="text-xs font-medium leading-tight text-white md:whitespace-nowrap">
        Your information is stored securely.
      </span>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          openPrivacyPolicy();
        }}
        className="hero-ribbon-interactive inline-flex shrink-0 items-center whitespace-nowrap text-[11px] font-semibold leading-snug text-[#d4a63c] underline-offset-2 transition hover:text-[#e8c96a] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a63c]"
      >
        Privacy Policy →
      </button>
    </div>
  );
}
