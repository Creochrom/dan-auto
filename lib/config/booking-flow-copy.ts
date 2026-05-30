/** In-chat confirmation after successful booking handoff. */
export const BOOKING_CHAT_SUCCESS =
  "Booking request sent successfully. The workshop team has your details — we'll confirm your visit shortly.";

export const BOOKING_CHAT_ERROR =
  "We couldn't send your booking request. Please try again.";

export const BOOKING_CHAT_SENDING = "Sending your booking request…";

/** Quick reply chip ID — must match Gemini booking prompt. */
export const BOOKING_CONFIRM_CHIP_ID = "booking-confirm-send";

export const BOOKING_USE_STORED_PHONE_CHIP_ID = "booking-use-stored-phone";
export const BOOKING_USE_DIFFERENT_PHONE_CHIP_ID = "booking-use-different-phone";
export const BOOKING_CHANGE_DAY_CHIP_ID = "booking-change-day";
export const BOOKING_CHANGE_CONTACT_CHIP_ID = "booking-change-contact";
export const BOOKING_CHANGE_SERVICE_CHIP_ID = "booking-change-service";
export const BOOKING_CHANGE_DETAILS_CHIP_ID = "booking-change-details";
export const BOOKING_NOT_NOW_CHIP_ID = "booking-not-now";

/** Shown below the review summary before submission. */
export const BOOKING_REVIEW_HELPER =
  "Nothing will be sent to the workshop until you confirm.";

export const BOOKING_REVIEW_INTRO =
  "Please review your request before sending it to the workshop.";

export const BOOKING_CHANGE_DETAILS_PROMPT = "What would you like to change?";

export const BOOKING_NOT_NOW_ACK =
  "No problem — your details are saved. Continue our chat whenever you're ready, and tap Review booking when you want to send your request.";

/** Shown when booking saved but workshop email failed. */
export const BOOKING_NOTIFICATION_WARNING =
  "Workshop notification could not be delivered automatically. Please contact the workshop if you do not hear back shortly.";
