/**
 * Date helpers for booking UI.
 *
 * Uses the browser's local timezone so the value matches what the user sees
 * in the native `<input type="date">`. Avoids `toISOString()` because that
 * formats in UTC and can be off-by-one near midnight.
 */

/**
 * Returns a `YYYY-MM-DD` string for today + (`offsetDays` days, `offsetMonths` months)
 * in the local timezone.
 *
 * Month math is clamped to the end of the target month, so:
 *   localIsoDate(0, 1) on Jan 31 → Feb 28/29 (not Mar 3)
 *
 * @example
 *   localIsoDate(0)       // today
 *   localIsoDate(1)       // tomorrow
 *   localIsoDate(7)       // one week from today
 *   localIsoDate(0, 1)    // one month from today (clamped)
 */
export function localIsoDate(offsetDays = 0, offsetMonths = 0): string {
  const d = new Date();

  if (offsetMonths !== 0) {
    const targetMonth = d.getMonth() + offsetMonths;
    const originalDay = d.getDate();
    // setDate(1) first to avoid month-overflow during setMonth
    d.setDate(1);
    d.setMonth(targetMonth);
    // Clamp the day to the last day of the resulting month
    const lastDayOfTarget = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, lastDayOfTarget));
  }

  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
