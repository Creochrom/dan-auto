"use client";

import { useAdvisorChat } from "@/features/chat/hooks/useAdvisorChat";
import type { BookingChatContext } from "@/lib/types/chat";

/** Booking modal intake — scoped to selected slot */
export function useBookingIntakeChat(
  bookingContext: BookingChatContext | null,
  uploadIds: string[] = []
) {
  return useAdvisorChat({
    bookingContext,
    advisorRoute: bookingContext
      ? {
          entry_point: "booking_form_help",
          intent: "booking",
          surface: "booking_flow",
        }
      : null,
    enabled: Boolean(bookingContext),
    uploadIds,
    introMode: "workshop",
  });
}
