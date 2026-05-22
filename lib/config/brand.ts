import { businessConfig } from "@/lib/config/business";

/** Central brand strings — never hardcode "Dana" in UI or copy */
export const BRAND = {
  name: businessConfig.shortName,
  legalName: businessConfig.name,
  shortName: businessConfig.shortName,
  tagline: businessConfig.tagline,
  phone: businessConfig.phone.display,
  phoneHref: businessConfig.phone.telHref,
  email: businessConfig.email,
} as const;

export function advisorIntro(forBooking?: boolean): string {
  if (forBooking) {
    return `I'm your ${BRAND.shortName} service advisor. I'll help structure your booking request for our workshop team.`;
  }
  return `I'm your ${BRAND.shortName} service advisor — here to help you explain what's happening with your vehicle and prepare clear notes for our workshop team.`;
}

export const ADVISOR_TYPING_LABELS = {
  init: "Preparing your intake…",
  symptoms: "Reviewing your symptoms…",
  causes: "Checking common causes…",
  estimate: "Preparing guidance range…",
  logging: "Logging for the workshop…",
  summary: "Preparing workshop summary…",
  mot: "Reviewing MOT eligibility…",
} as const;
