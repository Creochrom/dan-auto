import { businessConfig } from "./business";
import { openingHours } from "./hours";

export { businessConfig, WHATSAPP_MOBILE_E164 } from "./business";
export { BRAND, advisorIntro, ADVISOR_TYPING_LABELS } from "./brand";
export { openingHours } from "./hours";
export {
  workshopServices,
  motPolicy,
  siteServices,
  bookingServiceOptions,
  quoteServiceOptions,
  bookingDurations,
  bookingTimeSlots,
} from "./services";
export type { SiteService } from "./services";

/** Backward-compatible BUSINESS shape for gradual migration from page.tsx */
export const BUSINESS = {
  name: businessConfig.name,
  shortName: businessConfig.shortName,
  tagline: businessConfig.tagline,
  phone: businessConfig.phone.display,
  phoneHref: businessConfig.phone.telHref,
  email: businessConfig.email,
  address: businessConfig.address.line,
  mapsHref: businessConfig.address.mapsHref,
  googleReviewsHref: businessConfig.googleReviewsHref,
  hours: openingHours.summary,
  hoursDetail: openingHours.detail,
  experience: businessConfig.experience,
  googleRating: businessConfig.googleRating,
  googleReviewCount: businessConfig.googleReviewCount,
} as const;

export const WHATSAPP_HREF = businessConfig.whatsapp.href;
