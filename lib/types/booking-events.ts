/**
 * Booking audit / notification event types.
 * Stored in booking_change_events — not derived from email content.
 */

export const BOOKING_EVENT_TYPES = [
  "BOOKING_CREATED",
  "BOOKING_UPDATED",
  "BOOKING_CANCELLED",
] as const;

export type BookingEventType = (typeof BOOKING_EVENT_TYPES)[number];

export const BOOKING_TRACKABLE_FIELDS = [
  "preferredDate",
  "preferredTime",
  "service",
  "notes",
] as const;

export type BookingTrackableField = (typeof BOOKING_TRACKABLE_FIELDS)[number];

export type BookingFieldChange = {
  field: BookingTrackableField;
  label: string;
  oldValue: string;
  newValue: string;
};

export type BookingChangeSnapshot = Partial<
  Record<BookingTrackableField, string | undefined>
>;

export type BookingChangeEvent = {
  id: string;
  bookingId: string;
  eventType: BookingEventType;
  changedBy: string;
  previousValues: BookingChangeSnapshot;
  newValues: BookingChangeSnapshot;
  changedFields: BookingTrackableField[];
  createdAt: string;
};

export type CreateBookingChangeEventInput = {
  bookingId: string;
  eventType: BookingEventType;
  changedBy?: string;
  previousValues: BookingChangeSnapshot;
  newValues: BookingChangeSnapshot;
  changedFields: BookingTrackableField[];
};
