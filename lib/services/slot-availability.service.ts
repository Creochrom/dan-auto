/**
 * Slot availability facade — delegates to the shared workshop availability service.
 * Prefer importing from `@/lib/workshop/availability` for new code.
 */

export {
  getAvailableSlots as getSlotAvailability,
  getAvailableSlotsRange as getSlotAvailabilityRange,
  getAvailableSlots,
  getAvailableSlotsRange,
  isWorkshopOpen,
  isWorkshopClosed,
  isSunday,
  getClosedReason,
  assertBookableDate,
  WorkshopClosedError,
} from "@/lib/workshop/availability";
