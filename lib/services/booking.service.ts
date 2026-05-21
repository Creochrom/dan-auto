import { bookingsRepository } from "@/lib/repositories/bookings.repository";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/types/booking";

export const bookingService = {
  list(status?: BookingStatus) {
    return bookingsRepository.list(status);
  },

  create(input: CreateBookingInput): Booking {
    return bookingsRepository.create(input);
  },

  updateStatus(id: string, status: BookingStatus) {
    return bookingsRepository.updateStatus(id, status);
  },
};
