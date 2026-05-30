/** Human-readable booking date for emails and admin UI (e.g. 30 Jun 2026). */
export function formatBookingDateDisplay(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return trimmed;
}

/** Registration for email subjects — keeps spacing when present. */
export function formatRegistrationForSubject(registration: string): string {
  const trimmed = registration.trim();
  return trimmed || "NO-REG";
}

/** New booking subject slot: `30 Jun 2026 13:30` */
export function formatBookingSlotForSubject(
  preferredDate: string,
  preferredTime: string
): string {
  const date = formatBookingDateDisplay(preferredDate);
  const time = preferredTime.trim();
  if (date && time) return `${date} ${time}`;
  return date || time || "";
}
