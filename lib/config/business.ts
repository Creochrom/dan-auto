/**
 * Central business configuration — single source of truth for Dana Auto Centre.
 */

function formatUkMobileDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("07")) {
    return `${d.slice(0, 5)} ${d.slice(5)}`;
  }
  return digits;
}

const MOBILE_RAW = process.env.NEXT_PUBLIC_CONTACT_MOBILE ?? "07850964041";
const MOBILE_E164 = MOBILE_RAW.startsWith("44")
  ? MOBILE_RAW.replace(/\D/g, "")
  : `44${MOBILE_RAW.replace(/^0/, "").replace(/\D/g, "")}`;

export const businessConfig = {
  name: "Dan Auto Centre LTD",
  shortName: "Dan Auto Centre",
  tagline: "One-stop garage for car repair & maintenance in Southampton",
  phone: {
    display: formatUkMobileDisplay(MOBILE_RAW),
    telHref: `tel:${MOBILE_RAW.replace(/\s/g, "")}`,
    mobileE164: MOBILE_E164,
  },
  whatsapp: {
    mobileE164: MOBILE_E164,
    get href() {
      return `https://wa.me/${this.mobileE164}`;
    },
    defaultMessage:
      "Hi Dana Auto Centre — I'd like help with my vehicle.",
  },
  email: "contact@danautocentre.co.uk",
  address: {
    line: "9 Park Rd, Southampton SO15 3AS",
    mapsHref:
      "https://www.google.com/maps/dir//Dan+Auto+Centre+Ltd/@50.9104006,-1.463707,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x48747697f33e1945:0x31049542cb368570!2m2!1d-1.4224711!2d50.9104121",
  },
  googleReviewsHref:
    "https://maps.google.com/?cid=3532112121875039600",
  experience: "25+",
  googleRating: "4.9",
  googleReviewCount: "80",
} as const;

export type BusinessConfig = typeof businessConfig;

/** @deprecated Use businessConfig.phone.mobileE164 */
export const WHATSAPP_MOBILE_E164 = MOBILE_E164;
