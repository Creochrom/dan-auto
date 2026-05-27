import {
  getEmailApiKey,
  getEmailFrom,
  getEmailProvider,
  getIntakeEmailTo,
} from "@/lib/email/config";

export type EmailHealthReport = {
  provider: "resend" | "log";
  hasApiKey: boolean;
  /** Workshop inbox domain only (e.g. gmail.com) — not the full address */
  intakeToDomain: string;
  intakeToConfigured: boolean;
  /** Sender domain or "default" */
  fromDomain: string;
  fromAllowed: boolean;
  /** True when production can deliver via Resend with a valid sender */
  ready: boolean;
  warnings: string[];
  resendProbe?: {
    ok: boolean;
    status: number;
    detail?: string;
  };
};

function domainFromAddress(addr: string): string {
  const m = addr.match(/@([^>\s]+)/);
  return m?.[1]?.toLowerCase() ?? "unknown";
}

function isDisallowedSender(from: string): boolean {
  return (
    /onboarding@resend\.dev/i.test(from) ||
    /@gmail\.com/i.test(from) ||
    /@googlemail\.com/i.test(from)
  );
}

export function assessEmailHealth(): EmailHealthReport {
  const provider = getEmailProvider();
  const hasApiKey = Boolean(getEmailApiKey());
  const from = getEmailFrom();
  const to = getIntakeEmailTo();
  const fromAllowed = !isDisallowedSender(from);
  const warnings: string[] = [];

  if (provider === "log") {
    warnings.push(
      "EMAIL_PROVIDER=log — emails are logged only, not sent (fine for local dev)."
    );
  }

  if (provider === "resend" && !hasApiKey) {
    warnings.push("RESEND_API_KEY (or EMAIL_PROVIDER_API_KEY) is missing.");
  }

  if (!fromAllowed) {
    warnings.push(
      "EMAIL_FROM cannot be Gmail — Resend requires a verified domain sender (e.g. contact@danautocentre.co.uk)."
    );
  }

  if (process.env.NODE_ENV === "production" && provider === "log") {
    warnings.push("Production should use EMAIL_PROVIDER=resend, not log.");
  }

  const ready = provider === "resend" && hasApiKey && fromAllowed;

  if (process.env.NODE_ENV === "production" && !ready) {
    warnings.push("Production email is not ready — bookings may not notify the workshop.");
  }

  return {
    provider,
    hasApiKey,
    intakeToDomain: domainFromAddress(to),
    intakeToConfigured: Boolean(
      process.env.EMAIL_TO?.trim() || process.env.BOOKING_EMAIL_TO?.trim()
    ),
    fromDomain: domainFromAddress(from),
    fromAllowed,
    ready,
    warnings,
  };
}

export async function probeResendApi(): Promise<EmailHealthReport["resendProbe"]> {
  const apiKey = getEmailApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, detail: "No API key configured" };
  }

  const res = await fetch("https://api.resend.com/domains", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return {
    ok: res.ok,
    status: res.status,
    detail: res.ok ? undefined : (body.message ?? `HTTP ${res.status}`),
  };
}
