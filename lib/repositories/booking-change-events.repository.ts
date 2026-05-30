import { mockStore } from "@/lib/repositories/mock-store";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseBookingChangeEventsRepository } from "@/lib/repositories/supabase/booking-change-events.repository";
import type {
  BookingChangeEvent,
  CreateBookingChangeEventInput,
} from "@/lib/types/booking-events";

function newId() {
  return `bce_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const bookingChangeEventsRepository = {
  async create(input: CreateBookingChangeEventInput): Promise<BookingChangeEvent> {
    if (getStorageBackend() === "supabase") {
      return supabaseBookingChangeEventsRepository.create(input);
    }

    const event: BookingChangeEvent = {
      id: newId(),
      bookingId: input.bookingId,
      eventType: input.eventType,
      changedBy: input.changedBy ?? "system",
      previousValues: input.previousValues,
      newValues: input.newValues,
      changedFields: input.changedFields,
      createdAt: new Date().toISOString(),
    };
    mockStore.bookingChangeEvents.push(event);
    return event;
  },

  async listForBooking(bookingId: string): Promise<BookingChangeEvent[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseBookingChangeEventsRepository.listForBooking(bookingId);
    }

    return mockStore.bookingChangeEvents
      .filter((e) => e.bookingId === bookingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
