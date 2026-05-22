import { BRAND } from "@/lib/config/brand";
import { businessConfig } from "@/lib/config/business";

/** Workshop intake inbox — server env only */
export function getIntakeEmailTo(): string {
  return (
    process.env.EMAIL_TO?.trim() ||
    process.env.BOOKING_EMAIL_TO?.trim() ||
    "creochrome@gmail.com"
  );
}

export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (from) return from;
  return `${BRAND.shortName} <onboarding@resend.dev>`;
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
