/** DB row for admin-driven day overrides. */
export type SlotOverride = {
  date: string;          // YYYY-MM-DD
  isClosed: boolean;
  closedSlots: string[] | null; // specific blocked time strings; null = none blocked
  capacity: number | null;      // null = unlimited
  note: string | null;
  updatedAt: string;
};

export type CreateSlotOverrideInput = Omit<SlotOverride, "updatedAt">;

/** Shape returned to the booking UI for a single date. */
export type SlotAvailability = {
  date: string;        // YYYY-MM-DD
  closed: boolean;     // entire day unavailable
  available: string[]; // time strings that can still be booked
};
