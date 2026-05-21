import { businessConfig } from "@/lib/config/business";

/** Target inbox for booking intake notifications (not wired to SMTP yet). */
export const BOOKING_EMAIL_TO = businessConfig.email;

export const EMAIL_FROM_DISPLAY = businessConfig.shortName;
