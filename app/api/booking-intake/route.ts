import { bookingIntakeService } from "@/lib/services/booking-intake.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { CompleteBookingIntakeInput } from "@/lib/types/service-intake";
import { bookingTraceEnd, bookingTraceStage } from "@/lib/logging/booking-trace";

/**
 * POST /api/booking-intake — finalize AI-assisted booking request.
 * Persists via bookingService.create() (workshop + customer notifications).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as CompleteBookingIntakeInput;
  const traceId = body.traceId ?? `btrace_route_${Date.now()}`;

  bookingTraceStage("5_booking_intake_route", traceId, {
    service: body.service?.trim() || null,
    preferredDate: body.preferredDate?.trim() || null,
    preferredTime: body.preferredTime?.trim() || null,
    chatSessionId: body.chatSessionId?.trim() || null,
    registration: body.registration?.trim() || null,
    hasCustomerName: Boolean(body.customerName?.trim()),
    hasCustomerPhone: Boolean(body.customerPhone?.trim()),
  });

  try {
    if (!body.service?.trim()) {
      bookingTraceEnd(traceId, "blocked", { stage: "5_booking_intake_route", reason: "service_required" });
      return jsonError("service is required");
    }
    if (!body.preferredDate?.trim()) {
      bookingTraceEnd(traceId, "blocked", { stage: "5_booking_intake_route", reason: "preferredDate_required" });
      return jsonError("preferredDate is required");
    }
    if (!body.preferredTime?.trim()) {
      bookingTraceEnd(traceId, "blocked", { stage: "5_booking_intake_route", reason: "preferredTime_required" });
      return jsonError("preferredTime is required");
    }
    if (!body.chatSessionId?.trim()) {
      bookingTraceEnd(traceId, "blocked", { stage: "5_booking_intake_route", reason: "chatSessionId_required" });
      return jsonError("chatSessionId is required");
    }

    const result = await bookingIntakeService.complete({
      service: body.service.trim(),
      preferredDate: body.preferredDate.trim(),
      preferredTime: body.preferredTime.trim(),
      chatSessionId: body.chatSessionId.trim(),
      uploadIds: body.uploadIds,
      registration: body.registration?.trim(),
      customerName: body.customerName?.trim(),
      customerPhone: body.customerPhone?.trim(),
      traceId,
    });

    bookingTraceStage("9_api_response", traceId, {
      route: "booking-intake",
      bookingId: result.bookingId,
      bookingCreated: result.bookingCreated,
      notificationSent: result.notificationSent,
      emailSent: result.notificationSent,
    });

    return jsonOk(result, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking intake failed";
    bookingTraceEnd(traceId, "failure", { stage: "5_booking_intake_route", error: message });
    return jsonError(message, 400);
  }
}
