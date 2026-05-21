import { mockStore } from "@/lib/repositories/mock-store";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/types/booking";

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const bookingsRepository = {
  list(status?: BookingStatus): Booking[] {
    const all = [...mockStore.bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return status ? all.filter((b) => b.status === status) : all;
  },

  findById(id: string): Booking | undefined {
    return mockStore.bookings.find((b) => b.id === id);
  },

  create(input: CreateBookingInput): Booking {
    const now = new Date().toISOString();
    const booking: Booking = {
      id: newId("bk"),
      status: "new",
      service: input.service,
      registration: input.registration.toUpperCase(),
      vehicleModel: input.vehicleModel,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      duration: input.duration,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      notes: input.notes,
      source: input.source ?? "website",
      intakeSummary: input.intakeSummary,
      uploadIds: input.uploadIds,
      createdAt: now,
      updatedAt: now,
    };
    mockStore.bookings.push(booking);
    return booking;
  },

  updateStatus(id: string, status: BookingStatus): Booking | null {
    const booking = mockStore.bookings.find((b) => b.id === id);
    if (!booking) return null;
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    return booking;
  },
};
