import { BRAND } from "@/lib/config/brand";
import { businessConfig } from "@/lib/config/business";

/** Verified Resend sender — danautocentre.co.uk domain */
export const DEFAULT_EMAIL_FROM = `${BRAND.shortName} <${businessConfig.email}>`;

/** Workshop intake inbox — server env only */
export function getIntakeEmailTo(): string {
  return (
    process.env.EMAIL_TO?.trim() ||
    process.env.BOOKING_EMAIL_TO?.trim() ||
    "creochrome@gmail.com"
  );
}

/** Resend test / unverified senders — never use in production */
function isDisallowedSender(from: string): boolean {
  return (
    /onboarding@resend\.dev/i.test(from) ||
    /@gmail\.com/i.test(from) ||
    /@googlemail\.com/i.test(from)
  );
}

export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (from && !isDisallowedSender(from)) return from;
  return DEFAULT_EMAIL_FROM;
}

export function getEmailApiKey(): string | undefined {
  return (
    process.env.EMAIL_PROVIDER_API_KEY?.trim() ||
    process.env.RESEND_API_KEY?.trim() ||
    undefined
  );
}

export function getEmailProvider(): "resend" | "log" {
  const p = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (p === "log") return "log";
  if (getEmailApiKey()) return "resend";
  if (process.env.NODE_ENV === "development") return "log";
  return "resend";
}

/** @deprecated Use getIntakeEmailTo() on the server */
export const BOOKING_EMAIL_TO = "creochrome@gmail.com";

export const EMAIL_FROM_DISPLAY = businessConfig.shortName;
