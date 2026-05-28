/**
 * Supabase implementation of the bookings repository.
 * Mirrors the interface of lib/repositories/bookings.repository.ts exactly.
 * Only active when STORAGE_BACKEND=supabase.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingInput,
} from "@/lib/types/booking";
import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

/** DB row shape — snake_case as returned by PostgREST */
type BookingRow = {
  id: string;
  status: BookingStatus;
  service: string;
  registration: string;
  vehicle_model: string | null;
  preferred_date: string;
  preferred_time: string;
  duration: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  source: Booking["source"];
  intake_summary: ServiceIntakeSummary | null;
  upload_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    status: row.status,
    service: row.service,
    registration: row.registration,
    vehicleModel: row.vehicle_model ?? undefined,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    duration: row.duration,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? undefined,
    notes: row.notes ?? undefined,
    source: row.source,
    intakeSummary: row.intake_summary ?? undefined,
    uploadIds: row.upload_ids ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newId() {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseBookingsRepository = {
  async list(status?: BookingStatus): Promise<Booking[]> {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[bookings] list failed: ${error.message}`);

    return (data as BookingRow[]).map(toBooking);
  },

  async findById(id: string): Promise<Booking | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`[bookings] findById failed: ${error.message}`);
    if (!data) return undefined;

    return toBooking(data as BookingRow);
  },

  async create(input: CreateBookingInput): Promise<Booking> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const id = newId();

    const row: BookingRow = {
      id,
      status: "new",
      service: input.service,
      registration: input.registration.toUpperCase(),
      vehicle_model: input.vehicleModel ?? null,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      duration: input.duration,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail ?? null,
      notes: input.notes ?? null,
      source: input.source ?? "website",
      intake_summary: input.intakeSummary ?? null,
      upload_ids: input.uploadIds ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`[bookings] create failed: ${error.message}`);

    return toBooking(data as BookingRow);
  },

  async updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`[bookings] updateStatus failed: ${error.message}`);
    if (!data) return null;

    return toBooking(data as BookingRow);
  },

  async update(id: string, patch: UpdateBookingInput): Promise<Booking | null> {
    const supabase = getSupabaseServerClient();
    const updates: Partial<BookingRow> = {};
    if (patch.status !== undefined) updates.status = patch.status;
    if (patch.preferredDate !== undefined) updates.preferred_date = patch.preferredDate;
    if (patch.preferredTime !== undefined) updates.preferred_time = patch.preferredTime;
    if (patch.notes !== undefined) updates.notes = patch.notes;

    if (Object.keys(updates).length === 0) {
      return (await this.findById(id)) ?? null;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`[bookings] update failed: ${error.message}`);
    if (!data) return null;

    return toBooking(data as BookingRow);
  },
};
