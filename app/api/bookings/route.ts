import { bookingService } from "@/lib/services/booking.service";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { BookingStatus, CreateBookingInput } from "@/lib/types/booking";

/**
 * GET /api/bookings — list bookings (admin-ready).
 * POST /api/bookings — create booking request.
 * TODO: Add auth middleware for GET; persist to Supabase.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as BookingStatus | null;
  const bookings = bookingService.list(status ?? undefined);
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

    const booking = bookingService.create({
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
    const message = e instanceof Error ? e.message : "Booking failed";
    return jsonError(message, 500);
  }
}
