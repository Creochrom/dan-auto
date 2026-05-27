import { jsonError, jsonOk } from "@/lib/api/response";
import { assessEmailHealth, probeResendApi } from "@/lib/email/health";

/**
 * GET /api/health/email — email config sanity check (no secrets returned).
 *
 * Query:
 *   ?probe=1 — optional Resend API ping (domains list) to verify the API key.
 *
 * Gmail inbox: set EMAIL_TO to your Gmail for workshop notifications while the
 * danautocentre.co.uk domain is pending verification. Sending still uses Resend
 * + verified FROM — see docs/EMAIL_SETUP.md.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const report = assessEmailHealth();

    if (searchParams.get("probe") === "1") {
      if (report.provider !== "resend" || !report.hasApiKey) {
        report.warnings.push("Skipped Resend probe — provider is log or API key missing.");
      } else {
        const probe = await probeResendApi();
        report.resendProbe = probe;
        if (probe && !probe.ok) {
          report.warnings.push(
            `Resend API probe failed: ${probe.detail ?? probe.status}`
          );
        }
      }
    }

    const status = report.ready ? 200 : report.provider === "log" ? 200 : 503;
    return jsonOk(report, status);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email health check failed";
    return jsonError(message, 500);
  }
}
