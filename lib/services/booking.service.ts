import { bookingsRepository } from "@/lib/repositories/bookings.repository";
import { getStorageBackend } from "@/lib/repositories/backend";
import {
  sendCustomerBookingConfirmation,
  sendWorkshopBookingAlert,
  type NotificationSendResult,
} from "@/lib/email/send-booking-alert";
import { sendWorkshopIntakeEmail } from "@/lib/email/send-workshop-intake";
import { getEmailProvider } from "@/lib/email/config";
import { logBookingEvent } from "@/lib/logging/booking-events";
import type { ChatMessage } from "@/lib/types/chat";
import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingInput,
} from "@/lib/types/booking";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

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
};

export type BookingCreateNotifications = {
  workshop?: NotificationSendResult;
  customer?: NotificationSendResult;
};

export type BookingCreateResult = {
  booking: Booking;
  notifications: BookingCreateNotifications;
};

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
    const booking = await bookingsRepository.create(input);

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

    notifications.customer = await sendCustomerBookingConfirmation(booking);

    return { booking, notifications };
  },

  updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    return bookingsRepository.updateStatus(id, status);
  },

  update(id: string, patch: UpdateBookingInput): Promise<Booking | null> {
    return bookingsRepository.update(id, patch);
  },
};
