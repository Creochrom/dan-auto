export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import { bookingService } from "@/lib/services/booking.service";
import { jobService } from "@/lib/services/job.service";

type CheckInPhotoInput = {
  uploadId?: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
};

export async function POST(request: Request) {
  const { session, unauthorized } = await requireAdminSession();
  if (!session) return unauthorized!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("Body must be an object", 400);
  }

  const b = body as Record<string, unknown>;
  const bookingId =
    typeof b.bookingId === "string" && b.bookingId.trim() ? b.bookingId.trim() : "";
  if (!bookingId) {
    return jsonError("bookingId is required", 400);
  }

  const booking = await bookingService.findById(bookingId);
  if (!booking) return jsonError("Booking not found", 404);

  const ensure = await jobService.ensureBookingJob({
    bookingId: booking.id,
    registration: booking.registration,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    service: booking.service,
    scheduledDate: booking.preferredDate,
    symptomsText: booking.intakeSummary?.symptoms ?? booking.notes,
    actor: session.login,
  });

  const mileage =
    typeof b.mileage === "number" && Number.isFinite(b.mileage)
      ? Math.max(0, Math.round(b.mileage))
      : undefined;
  const damage = typeof b.damage === "string" ? b.damage.trim() : undefined;
  const notes = typeof b.notes === "string" ? b.notes.trim() : undefined;

  const photos = Array.isArray(b.photos)
    ? b.photos
        .map((entry): CheckInPhotoInput | null => {
          if (typeof entry !== "object" || entry === null) return null;
          const p = entry as Record<string, unknown>;
          const fileName =
            typeof p.fileName === "string" && p.fileName.trim() ? p.fileName.trim() : "";
          if (!fileName) return null;
          return {
            uploadId:
              typeof p.uploadId === "string" && p.uploadId.trim()
                ? p.uploadId.trim()
                : undefined,
            fileName,
            mimeType:
              typeof p.mimeType === "string" && p.mimeType.trim()
                ? p.mimeType.trim()
                : undefined,
            sizeBytes: typeof p.sizeBytes === "number" ? p.sizeBytes : undefined,
            storagePath:
              typeof p.storagePath === "string" && p.storagePath.trim()
                ? p.storagePath.trim()
                : undefined,
          };
        })
        .filter((x): x is CheckInPhotoInput => Boolean(x))
    : [];

  try {
    const result = await jobService.checkInFromBooking({
      bookingId: booking.id,
      mileage,
      damage,
      notes,
      photos,
      actor: session.login,
    });

    return jsonOk({
      job: result.job,
      createdFromBooking: ensure.created,
      upgraded: result.upgraded,
    });
  } catch (err) {
    console.error("[jobs/check-in] POST error:", err);
    return jsonError("Failed to check-in job", 500);
  }
}
