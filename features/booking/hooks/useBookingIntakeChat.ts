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
    enabled: Boolean(bookingContext),
    uploadIds,
  });
}
