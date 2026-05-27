import { bookingsRepository } from "@/lib/repositories/bookings.repository";
import {
  sendCustomerBookingConfirmation,
  sendWorkshopBookingAlert,
} from "@/lib/email/send-booking-alert";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/types/booking";

/**
 * Service-layer options for booking creation.
 * Not persisted — controls side-effects only.
 *
 * suppressWorkshopEmail: set to true when the caller already sends its own
 * richer workshop notification (e.g. bookingIntakeService which includes the
 * full conversation transcript). Customer confirmation still fires regardless.
 */
export type BookingCreateOptions = {
  suppressWorkshopEmail?: boolean;
};

export const bookingService = {
  list(status?: BookingStatus): Promise<Booking[]> {
    return bookingsRepository.list(status);
  },

  async create(input: CreateBookingInput, opts?: BookingCreateOptions): Promise<Booking> {
    const booking = await bookingsRepository.create(input);

    // Run notifications concurrently; both swallow errors internally so a
    // transient email failure never rolls back a successfully persisted booking.
    await Promise.all([
      opts?.suppressWorkshopEmail ? Promise.resolve() : sendWorkshopBookingAlert(booking),
      sendCustomerBookingConfirmation(booking),
    ]);

    return booking;
  },

  updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    return bookingsRepository.updateStatus(id, status);
  },
};
