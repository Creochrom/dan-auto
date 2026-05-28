/**
 * Booking domain model — ready for Supabase / PostgreSQL migration.
 */

import type { ServiceIntakeSummary } from "@/lib/types/service-intake";

export const BOOKING_STATUSES = [
  "new",
  "awaiting_callback",
  "confirmed",
  "rescheduled",
  "rejected",
  "in_progress",
  "completed",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  status: BookingStatus;
  service: string;
  registration: string;
  vehicleModel?: string;
  preferredDate: string;
  preferredTime: string;
  duration: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  source: "website" | "assistant" | "admin" | "phone";
  /** AI-assisted intake summary */
  intakeSummary?: ServiceIntakeSummary;
  uploadIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingInput = {
  service: string;
  registration: string;
  vehicleModel?: string;
  preferredDate: string;
  preferredTime: string;
  duration: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  source?: Booking["source"];
  intakeSummary?: ServiceIntakeSummary;
  uploadIds?: string[];
};

export type UpdateBookingInput = {
  status?: BookingStatus;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
};
