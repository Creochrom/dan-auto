import { requireAdminSession } from "@/lib/admin/guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { bookingService } from "@/lib/services/booking.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const booking = await bookingService.findById(id);
  if (!booking) return jsonError("Booking not found", 404);
  return jsonOk({ booking });
}
