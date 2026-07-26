import { requireAdminSession } from "@/lib/admin/guard";
import { bookingService } from "@/lib/services/booking.service";
import { jobService } from "@/lib/services/job.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { parseBody, updateBookingSchema } from "@/lib/validation/schemas";
import type { BookingStatus, CreateBookingInput } from "@/lib/types/booking";
import { parseEstimatedRangePence } from "@/lib/workshop/revenue-pipeline";
import { WorkshopClosedError } from "@/lib/workshop/availability";

/**
 * GET /api/bookings — list bookings (admin session required).
 * POST /api/bookings — create booking request (public).
 */
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as BookingStatus | null;
  const bookings = await bookingService.list(status ?? undefined);
  return jsonOk(bookings);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingInput;

    if (!body.service?.trim()) return jsonError("service is required");
    if (!body.registration?.trim()) return jsonError("registration is required");
    if (!body.preferredDate?.trim()) return jsonError("preferredDate is required");
    if (!body.preferredTime?.trim()) return jsonError("preferredTime is required");
    if (!body.customerName?.trim()) return jsonError("customerName is required");
    if (!body.customerPhone?.trim()) return jsonError("customerPhone is required");

    const { booking } = await bookingService.create({
      ...body,
      service: body.service.trim(),
      registration: body.registration.trim(),
      preferredDate: body.preferredDate.trim(),
      preferredTime: body.preferredTime.trim(),
      duration: body.duration?.trim() || "1h",
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim(),
      notes: body.notes?.trim(),
      source: body.source ?? "website",
    });

    return jsonOk(booking, 201);
  } catch (e) {
    if (e instanceof WorkshopClosedError) {
      return jsonError(e.message || "Workshop closed", 400);
    }
    const message = e instanceof Error ? e.message : "Booking failed";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = parseBody(updateBookingSchema, body);
  if (parsed.error) return parsed.error;

  const { id, status, preferredDate, preferredTime, notes } = parsed.data;
  try {
    const result = await bookingService.update(
      id,
      {
        ...(status !== undefined ? { status } : {}),
        ...(preferredDate !== undefined ? { preferredDate } : {}),
        ...(preferredTime !== undefined ? { preferredTime } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      { actor: session.login }
    );
    if (!result) return jsonError("Booking not found", 404);

    const { booking } = result;

    let job: { id: string; created: boolean } | null = null;
    if (status === "confirmed") {
      const estimateMid = parseEstimatedRangePence(
        booking.intakeSummary?.estimatedRange ?? null
      )?.midPence;
      const ensured = await jobService.ensureBookingJob({
        bookingId: booking.id,
        registration: booking.registration,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        service: booking.service,
        scheduledDate: booking.preferredDate,
        symptomsText: booking.intakeSummary?.symptoms ?? booking.notes,
        estimatedValuePence: estimateMid ?? null,
        actor: session.login,
      });
      job = { id: ensured.job.id, created: ensured.created };
    }

    return jsonOk({ booking, job });
  } catch (e) {
    if (e instanceof WorkshopClosedError) {
      return jsonError(e.message || "Workshop closed", 400);
    }
    const message = e instanceof Error ? e.message : "Failed to update booking";
    return jsonError(message, 500);
  }
}
