import { bookingIntakeService } from "@/lib/services/booking-intake.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { CompleteBookingIntakeInput } from "@/lib/types/service-intake";

/**
 * POST /api/booking-intake — finalize AI-assisted booking request.
 * Prepares email payload (not sent until provider wired).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteBookingIntakeInput;

    if (!body.service?.trim()) return jsonError("service is required");
    if (!body.preferredDate?.trim()) return jsonError("preferredDate is required");
    if (!body.preferredTime?.trim()) return jsonError("preferredTime is required");
    if (!body.chatSessionId?.trim()) return jsonError("chatSessionId is required");

    const result = bookingIntakeService.complete({
      service: body.service.trim(),
      preferredDate: body.preferredDate.trim(),
      preferredTime: body.preferredTime.trim(),
      chatSessionId: body.chatSessionId.trim(),
      uploadIds: body.uploadIds,
      registration: body.registration?.trim(),
    });

    return jsonOk(result, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking intake failed";
    return jsonError(message, 400);
  }
}
