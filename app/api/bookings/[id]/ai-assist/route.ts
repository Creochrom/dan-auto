import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { bookingService } from "@/lib/services/booking.service";
import { copilotService } from "@/lib/services/copilot.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistPayload = {
  frontDeskSummary: string;
  serviceCategorySuggestion: {
    suggestedCategory: string;
    reason: string;
  };
};

function buildBookingContext(booking: Awaited<ReturnType<typeof bookingService.findById>>) {
  if (!booking) return "";
  const intake = booking.intakeSummary;
  return [
    `Booking ID: ${booking.id}`,
    `Status: ${booking.status}`,
    `Service requested: ${booking.service}`,
    `Registration: ${booking.registration}`,
    `Preferred slot: ${booking.preferredDate} ${booking.preferredTime}`,
    `Customer: ${booking.customerName} (${booking.customerPhone})`,
    booking.customerEmail ? `Customer email: ${booking.customerEmail}` : null,
    booking.notes ? `Booking notes: ${booking.notes}` : null,
    intake?.symptoms ? `Intake symptoms: ${intake.symptoms}` : null,
    intake?.possibleCauses?.length
      ? `Possible causes: ${intake.possibleCauses.join(", ")}`
      : null,
    intake?.urgency ? `Intake urgency: ${intake.urgency}` : null,
    intake?.estimatedRange ? `Indicative range: ${intake.estimatedRange}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseServiceCategoryJson(raw: string): { suggestedCategory: string; reason: string } {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned) as { suggestedCategory?: unknown; reason?: unknown };
    return {
      suggestedCategory:
        typeof parsed.suggestedCategory === "string" && parsed.suggestedCategory.trim()
          ? parsed.suggestedCategory.trim()
          : "Other",
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim()
          : "Insufficient detail to classify confidently.",
    };
  } catch {
    return {
      suggestedCategory: "Other",
      reason: "Model returned non-JSON response; classify manually.",
    };
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const booking = await bookingService.findById(id);
  if (!booking) return jsonError("Booking not found", 404);

  const context = buildBookingContext(booking);

  try {
    const [summaryResult, categoryResult] = await Promise.all([
      copilotService.ask({
        promptKind: "intake_frontdesk_summary",
        message:
          "Create a front-desk summary for this booking. Keep it short and operational.",
        context,
      }),
      copilotService.ask({
        promptKind: "intake_service_category",
        message:
          "Suggest the most likely service category from this intake. Recommendation only.",
        context,
      }),
    ]);

    const payload: AssistPayload = {
      frontDeskSummary: summaryResult.reply.trim(),
      serviceCategorySuggestion: parseServiceCategoryJson(categoryResult.reply),
    };

    return jsonOk(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate AI assist";
    return jsonError(message, 500);
  }
}
