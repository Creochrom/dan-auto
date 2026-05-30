import { formatBookingDateDisplay } from "@/lib/booking/format-booking-display";
import type { Booking } from "@/lib/types/booking";
import type {
  BookingChangeSnapshot,
  BookingFieldChange,
  BookingTrackableField,
} from "@/lib/types/booking-events";

const FIELD_LABELS: Record<BookingTrackableField, string> = {
  preferredDate: "Date",
  preferredTime: "Time",
  service: "Service",
  notes: "Notes",
};

function normalizeFieldValue(field: BookingTrackableField, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (field === "preferredDate") return formatBookingDateDisplay(trimmed);
  return trimmed;
}

function rawFieldValue(booking: Booking, field: BookingTrackableField): string | undefined {
  switch (field) {
    case "preferredDate":
      return booking.preferredDate;
    case "preferredTime":
      return booking.preferredTime;
    case "service":
      return booking.service;
    case "notes":
      return booking.notes;
    default:
      return undefined;
  }
}

export function bookingChangeSnapshot(
  booking: Booking,
  fields: readonly BookingTrackableField[]
): BookingChangeSnapshot {
  const snapshot: BookingChangeSnapshot = {};
  for (const field of fields) {
    snapshot[field] = rawFieldValue(booking, field);
  }
  return snapshot;
}

/** Compare booking rows — uses persisted values, not email content. */
export function computeBookingFieldChanges(
  before: Booking,
  after: Booking
): BookingFieldChange[] {
  const changes: BookingFieldChange[] = [];

  for (const field of Object.keys(FIELD_LABELS) as BookingTrackableField[]) {
    const oldRaw = rawFieldValue(before, field);
    const newRaw = rawFieldValue(after, field);
    if ((oldRaw?.trim() ?? "") === (newRaw?.trim() ?? "")) continue;

    changes.push({
      field,
      label: FIELD_LABELS[field],
      oldValue: normalizeFieldValue(field, oldRaw) || "—",
      newValue: normalizeFieldValue(field, newRaw) || "—",
    });
  }

  return changes;
}
