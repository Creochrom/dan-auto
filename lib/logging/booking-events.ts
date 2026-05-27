/**
 * Structured booking / notification logs for production observability.
 * JSON lines parse cleanly in Vercel log drains.
 */

export function logBookingEvent(
  event:
    | "booking.created"
    | "notification.sent"
    | "notification.failed"
    | "notification.skipped",
  data: Record<string, unknown>
): void {
  console.info(
    JSON.stringify({
      scope: "booking",
      event,
      timestamp: new Date().toISOString(),
      ...data,
    })
  );
}
