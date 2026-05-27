/** First turn when user chooses mechanic callback — shown locally before API session. */
export const CALLBACK_OPENING_QUESTION =
  "What would you like to speak with the mechanic about?";

export const CALLBACK_SUBMIT_SUCCESS = `I've prepared your request and sent it to the Dan Auto Centre team.

One of our technicians will contact you as soon as they become available.

Happy to help with anything else regarding your vehicle.`;

/** In-chat confirmation after successful workshop handoff. */
export const CALLBACK_CHAT_SUCCESS =
  "Callback request sent successfully. A mechanic has received your request — we'll contact you shortly.";

export const CALLBACK_CHAT_ERROR =
  "We couldn't send your callback request. Please try again.";

export const CALLBACK_CHAT_SENDING = "Sending your callback request…";

export const CALLBACK_STATUS_SENT = "Callback request sent to workshop team";

/** Quick reply chip IDs — must match Gemini prompt. */
export const CALLBACK_TIME_CHIP_IDS = [
  "callback-time-asap",
  "callback-time-morning",
  "callback-time-afternoon",
  "callback-time-evening",
  "callback-time-any",
  "callback-time-custom",
] as const;

export const CALLBACK_CONFIRM_CHIP_ID = "callback-confirm-send";
