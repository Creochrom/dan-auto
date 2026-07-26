import { bookingsRepository } from "@/lib/repositories/bookings.repository";
import { bookingChangeEventsRepository } from "@/lib/repositories/booking-change-events.repository";
import { getStorageBackend } from "@/lib/repositories/backend";
import {
  sendCustomerBookingConfirmation,
  sendWorkshopBookingAlert,
  sendWorkshopBookingCancelled,
  sendWorkshopBookingUpdated,
  type NotificationSendResult,
} from "@/lib/email/send-booking-alert";
import { sendWorkshopIntakeEmail } from "@/lib/email/send-workshop-intake";
import { getEmailProvider } from "@/lib/email/config";
import {
  bookingChangeSnapshot,
  computeBookingFieldChanges,
} from "@/lib/booking/compute-booking-changes";
import { logBookingEvent } from "@/lib/logging/booking-events";
import { bookingTraceStage } from "@/lib/logging/booking-trace";
import type { ChatMessage } from "@/lib/types/chat";
import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingInput,
} from "@/lib/types/booking";
import type { BookingEventType, BookingTrackableField } from "@/lib/types/booking-events";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";
import { assertBookableDate } from "@/lib/workshop/availability";

/**
 * Service-layer options for booking creation.
 * Not persisted — controls side-effects only.
 */
export type BookingCreateOptions = {
  /** Skip standard workshop alert when a richer intake email is sent instead. */
  suppressWorkshopEmail?: boolean;
  /** AI intake path — sends transcript-rich workshop email from this service. */
  intakeNotification?: {
    summary: ServiceIntakeSummary;
    transcript?: ChatMessage[];
  };
  /** Correlates BOOKING_TRACE logs. */
  traceId?: string;
};

export type BookingUpdateOptions = {
  actor?: string;
};

export type BookingCreateNotifications = {
  workshop?: NotificationSendResult;
  customer?: NotificationSendResult;
};

export type BookingUpdateNotifications = {
  workshop?: NotificationSendResult;
};

export type BookingCreateResult = {
  booking: Booking;
  notifications: BookingCreateNotifications;
};

export type BookingUpdateResult = {
  booking: Booking;
  notifications: BookingUpdateNotifications;
};

function resolveUpdateEventType(
  before: Booking,
  after: Booking
): BookingEventType | null {
  if (after.status === "rejected" && before.status !== "rejected") {
    return "BOOKING_CANCELLED";
  }

  const changes = computeBookingFieldChanges(before, after);
  if (changes.length > 0) return "BOOKING_UPDATED";

  return null;
}

async function recordBookingChangeEvent(
  before: Booking | null,
  after: Booking,
  eventType: BookingEventType,
  changedFields: BookingTrackableField[],
  actor?: string
): Promise<void> {
  try {
    await bookingChangeEventsRepository.create({
      bookingId: after.id,
      eventType,
      changedBy: actor ?? "system",
      previousValues: before
        ? bookingChangeSnapshot(before, changedFields)
        : {},
      newValues: bookingChangeSnapshot(after, changedFields),
      changedFields,
    });
  } catch (err) {
    logBookingEvent("audit.failed", {
      bookingId: after.id,
      eventType,
      changedFields,
      actor: actor ?? "system",
      storageBackend: getStorageBackend(),
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export const bookingService = {
  list(status?: BookingStatus): Promise<Booking[]> {
    return bookingsRepository.list(status);
  },

  findById(id: string): Promise<Booking | undefined> {
    return bookingsRepository.findById(id);
  },

  /**
   * 1. Persist booking
   * 2. Notify workshop (standard alert or AI intake email)
   * 3. Optional customer confirmation
   * Email failures never roll back persistence.
   */
  async create(
    input: CreateBookingInput,
    opts?: BookingCreateOptions
  ): Promise<BookingCreateResult> {
    await assertBookableDate(input.preferredDate);

    const booking = await bookingsRepository.create(input);

    if (opts?.traceId) {
      bookingTraceStage("7_database_insert", opts.traceId, {
        bookingId: booking.id,
        storageBackend: getStorageBackend(),
        registration: booking.registration,
        status: booking.status,
        source: booking.source,
      });
    }

    const createdFields = [
      "preferredDate",
      "preferredTime",
      "service",
      "notes",
    ] as const satisfies readonly BookingTrackableField[];

    await recordBookingChangeEvent(
      null,
      booking,
      "BOOKING_CREATED",
      [...createdFields],
      "system"
    );

    logBookingEvent("booking.created", {
      bookingId: booking.id,
      storageBackend: getStorageBackend(),
      provider: getEmailProvider(),
      source: booking.source,
      registration: booking.registration,
      hasCustomerEmail: Boolean(booking.customerEmail),
    });

    const notifications: BookingCreateNotifications = {};

    if (opts?.intakeNotification) {
      notifications.workshop = await sendWorkshopIntakeEmail(
        booking,
        opts.intakeNotification.summary,
        { transcript: opts.intakeNotification.transcript }
      );
    } else if (!opts?.suppressWorkshopEmail) {
      notifications.workshop = await sendWorkshopBookingAlert(booking);
    } else {
      logBookingEvent("notification.skipped", {
        kind: "workshop",
        bookingId: booking.id,
        reason: "suppressWorkshopEmail",
      });
    }

    if (opts?.traceId) {
      bookingTraceStage("8_email_send", opts.traceId, {
        bookingId: booking.id,
        emailSent: Boolean(notifications.workshop?.sent),
        emailId: notifications.workshop?.messageId ?? null,
        provider: notifications.workshop?.provider ?? null,
        error: notifications.workshop?.error ?? null,
      });
    }

    notifications.customer = await sendCustomerBookingConfirmation(booking);

    return { booking, notifications };
  },

  updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    return bookingsRepository.updateStatus(id, status);
  },

  async update(
    id: string,
    patch: UpdateBookingInput,
    opts?: BookingUpdateOptions
  ): Promise<BookingUpdateResult | null> {
    const before = await bookingsRepository.findById(id);
    if (!before) return null;

    if (patch.preferredDate !== undefined) {
      await assertBookableDate(patch.preferredDate);
    }

    const after = await bookingsRepository.update(id, patch);
    if (!after) return null;

    const changes = computeBookingFieldChanges(before, after);
    const eventType = resolveUpdateEventType(before, after);
    const changedFields = changes.map((c) => c.field);

    if (eventType) {
      await recordBookingChangeEvent(
        before,
        after,
        eventType,
        changedFields,
        opts?.actor
      );
    }

    logBookingEvent("booking.updated", {
      bookingId: after.id,
      eventType: eventType ?? "none",
      changedFields,
      actor: opts?.actor ?? "system",
      storageBackend: getStorageBackend(),
      provider: getEmailProvider(),
    });

    const notifications: BookingUpdateNotifications = {};

    if (eventType === "BOOKING_CANCELLED") {
      notifications.workshop = await sendWorkshopBookingCancelled(after, changes);
    } else if (eventType === "BOOKING_UPDATED") {
      notifications.workshop = await sendWorkshopBookingUpdated(after, changes);
    }

    return { booking: after, notifications };
  },

  async delete(id: string): Promise<boolean> {
    const existing = await bookingsRepository.findById(id);
    if (!existing) return false;

    const deleted = await bookingsRepository.delete(id);
    if (deleted) {
      logBookingEvent("booking.deleted", {
        bookingId: id,
        storageBackend: getStorageBackend(),
        registration: existing.registration,
      });
    }
    return deleted;
  },
};
