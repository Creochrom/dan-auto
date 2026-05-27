import { mockStore } from "@/lib/repositories/mock-store";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseBookingsRepository } from "@/lib/repositories/supabase/bookings.repository";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/types/booking";

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const bookingsRepository = {
  async list(status?: BookingStatus): Promise<Booking[]> {
    if (getStorageBackend() === "supabase") return supabaseBookingsRepository.list(status);

    const all = [...mockStore.bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return status ? all.filter((b) => b.status === status) : all;
  },

  async findById(id: string): Promise<Booking | undefined> {
    if (getStorageBackend() === "supabase") return supabaseBookingsRepository.findById(id);

    return mockStore.bookings.find((b) => b.id === id);
  },

  async create(input: CreateBookingInput): Promise<Booking> {
    if (getStorageBackend() === "supabase") return supabaseBookingsRepository.create(input);

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

  async updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseBookingsRepository.updateStatus(id, status);
    }

    const booking = mockStore.bookings.find((b) => b.id === id);
    if (!booking) return null;
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    return booking;
  },
};
