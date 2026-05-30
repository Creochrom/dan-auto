import { BRAND } from "@/lib/config/brand";
import { businessConfig } from "@/lib/config/business";

/** Verified Resend sender — danautocentre.co.uk domain */
export const DEFAULT_EMAIL_FROM = `${BRAND.shortName} <${businessConfig.email}>`;

const DEV_FALLBACK_INTAKE_TO = "creochrome@gmail.com";

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Workshop inboxes for booking notifications (server env only).
 *
 * Supports comma-separated `BOOKING_EMAIL_TO` and optional `BOOKING_EMAIL_TO_SECONDARY`.
 */
export function getIntakeEmailRecipients(): string[] {
  const primary = parseEmailList(process.env.BOOKING_EMAIL_TO);
  const secondary = parseEmailList(process.env.BOOKING_EMAIL_TO_SECONDARY);
  const devFallback =
    process.env.NODE_ENV === "development" && primary.length === 0 && secondary.length === 0
      ? [DEV_FALLBACK_INTAKE_TO]
      : [];

  const seen = new Set<string>();
  return [...primary, ...secondary, ...devFallback].filter((email) => {
    const key = email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Comma-separated display string — used for previews and health checks. */
export function getIntakeEmailTo(): string {
  return getIntakeEmailRecipients().join(", ");
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
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

export function getEmailProvider(): "resend" | "log" {
  const p = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (p === "log") return "log";
  if (getEmailApiKey()) return "resend";
  if (process.env.NODE_ENV === "development") return "log";
  return "resend";
}

/** Block workshop handoff when production cannot deliver email. */
export function assertProductionEmailDelivery(): void {
  if (process.env.NODE_ENV !== "production") return;

  const provider = getEmailProvider();
  if (provider === "log") {
    throw new Error(
      "Workshop email is not configured for production (EMAIL_PROVIDER=log). Notifications cannot be sent."
    );
  }

  if (!getEmailApiKey()) {
    throw new Error("RESEND_API_KEY is not configured for production email delivery.");
  }

  if (getIntakeEmailRecipients().length === 0) {
    throw new Error("Workshop inbox is not configured (BOOKING_EMAIL_TO).");
  }
}

export const EMAIL_FROM_DISPLAY = businessConfig.shortName;
