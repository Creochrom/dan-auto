/**
 * Booking intake workflow — orchestrates lead → booking conversion.
 * TODO: Connect to Gemini multi-step workflow + Twilio notifications.
 */

import type { CreateBookingInput } from "@/lib/types/booking";
import type { CreateLeadInput } from "@/lib/types/lead";

export type BookingIntakeStep =
  | "greeting"
  | "collect_registration"
  | "collect_problem"
  | "collect_contact"
  | "collect_date"
  | "confirm"
  | "complete";

export type BookingIntakeState = {
  step: BookingIntakeStep;
  lead?: Partial<CreateLeadInput>;
  booking?: Partial<CreateBookingInput>;
};

export const bookingIntakeInitialState: BookingIntakeState = {
  step: "greeting",
};
