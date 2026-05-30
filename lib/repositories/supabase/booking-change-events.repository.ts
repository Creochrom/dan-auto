/**
 * Supabase booking change event repository.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BookingChangeEvent,
  BookingChangeSnapshot,
  BookingEventType,
  CreateBookingChangeEventInput,
} from "@/lib/types/booking-events";

type BookingChangeEventRow = {
  id: string;
  booking_id: string;
  event_type: BookingEventType;
  changed_by: string;
  previous_values: BookingChangeSnapshot;
  new_values: BookingChangeSnapshot;
  changed_fields: string[];
  created_at: string;
};

function toEvent(row: BookingChangeEventRow): BookingChangeEvent {
  return {
    id: row.id,
    bookingId: row.booking_id,
    eventType: row.event_type,
    changedBy: row.changed_by,
    previousValues: row.previous_values ?? {},
    newValues: row.new_values ?? {},
    changedFields: (row.changed_fields ?? []) as BookingChangeEvent["changedFields"],
    createdAt: row.created_at,
  };
}

function newId() {
  return `bce_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseBookingChangeEventsRepository = {
  async create(input: CreateBookingChangeEventInput): Promise<BookingChangeEvent> {
    const supabase = getSupabaseServerClient();
    const row = {
      id: newId(),
      booking_id: input.bookingId,
      event_type: input.eventType,
      changed_by: input.changedBy ?? "system",
      previous_values: input.previousValues,
      new_values: input.newValues,
      changed_fields: input.changedFields,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("booking_change_events")
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`[booking_change_events] create failed: ${error.message}`);
    }

    return toEvent(data as BookingChangeEventRow);
  },

  async listForBooking(bookingId: string): Promise<BookingChangeEvent[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("booking_change_events")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`[booking_change_events] list failed: ${error.message}`);
    }

    return (data as BookingChangeEventRow[]).map(toEvent);
  },
};
