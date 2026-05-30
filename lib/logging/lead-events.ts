/**
 * Structured lead / notification logs for production observability.
 */

export function logLeadEvent(
  event: "lead.created" | "notification.sent" | "notification.failed" | "notification.skipped",
  data: Record<string, unknown>
): void {
  console.info(
    JSON.stringify({
      scope: "lead",
      event,
      timestamp: new Date().toISOString(),
      ...data,
    })
  );
}
