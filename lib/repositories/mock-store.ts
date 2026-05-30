/**
 * In-memory mock persistence for Phase 1.
 * TODO: Replace with Supabase/PostgreSQL repositories.
 */

import type { Booking } from "@/lib/types/booking";
import type { ChatSession } from "@/lib/types/chat";
import type { Lead } from "@/lib/types/lead";
import type { MediaUpload } from "@/lib/types/upload";
import type { VehicleMemoryRecord } from "@/lib/types/vehicle-memory";

import type { BookingChangeEvent } from "@/lib/types/booking-events";

export type MockDataStore = {
  bookings: Booking[];
  bookingChangeEvents: BookingChangeEvent[];
  leads: Lead[];
  chatSessions: ChatSession[];
  uploads: MediaUpload[];
  /** Returning-customer memory keyed by canonical registration. */
  vehicleMemory: VehicleMemoryRecord[];
};

const STORE_KEY = "__danaAutoMockStore";

function getGlobalStore(): MockDataStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: MockDataStore };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      bookings: [],
      bookingChangeEvents: [],
      leads: [],
      chatSessions: [],
      uploads: [],
      vehicleMemory: [],
    };
  }
  // Backfill if an older shape exists in the global from a hot-reload.
  if (!g[STORE_KEY].vehicleMemory) g[STORE_KEY].vehicleMemory = [];
  if (!g[STORE_KEY].bookingChangeEvents) g[STORE_KEY].bookingChangeEvents = [];
  return g[STORE_KEY];
}

export const mockStore = {
  get bookings() {
    return getGlobalStore().bookings;
  },
  get bookingChangeEvents() {
    return getGlobalStore().bookingChangeEvents;
  },
  get leads() {
    return getGlobalStore().leads;
  },
  get chatSessions() {
    return getGlobalStore().chatSessions;
  },
  get uploads() {
    return getGlobalStore().uploads;
  },
  get vehicleMemory() {
    return getGlobalStore().vehicleMemory;
  },
};
