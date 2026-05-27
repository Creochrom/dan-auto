import { BRAND } from "@/lib/config/brand";
import type { SuggestionChip } from "@/lib/types/intake";

/** Workshop terminal headline — not a chatbot persona. */
export const WORKSHOP_INTRO_TITLE = "24/7 Service Assistant";

export const WORKSHOP_INTRO_BODY =
  "Get help with warning lights, unusual noises, running issues, MOT concerns and rough repair estimates before speaking with our workshop team.";

export const WORKSHOP_INTRO_PROMPT = "Tell us what's happening with the vehicle.";

export const BOOKING_INTRO_TITLE = "Workshop intake";

export const BOOKING_INTRO_BODY =
  "Confirm your booking details and note any symptoms so our team can prepare before you arrive.";

export const BOOKING_INTRO_PROMPT = "Anything we should know about the vehicle?";

export type QuickStartAction = SuggestionChip;

/** First-turn shortcuts — sent as the user's opening message when tapped. */
export const ADVISOR_QUICK_START_ACTIONS: QuickStartAction[] = [
  {
    id: "warning-light",
    label: "Warning light",
    message: "A dashboard warning light has come on and I need advice on what to do next.",
  },
  {
    id: "strange-noise",
    label: "Strange noise",
    message: "There is an unusual noise from the vehicle that I would like help understanding.",
  },
  {
    id: "brake-problem",
    label: "Brake problem",
    message: "I am having a brake-related issue and need guidance before booking in.",
  },
  {
    id: "car-shaking",
    label: "Car shaking",
    message: "The car is shaking or vibrating in a way that does not feel normal.",
  },
  {
    id: "mot-advice",
    label: "MOT advice",
    message: "I need MOT-related advice — advisories, preparation or booking guidance.",
  },
  {
    id: "engine-issue",
    label: "Engine issue",
    message: "There is an engine-related problem — power loss, rough running or a warning light.",
  },
  {
    id: "overheating",
    label: "Overheating",
    message: "The vehicle has overheated or the temperature warning has come on.",
  },
  {
    id: "service-question",
    label: "Service question",
    message: "I have a general servicing or maintenance question for the workshop.",
  },
];

export const BOOKING_QUICK_START_ACTIONS: QuickStartAction[] = [
  {
    id: "book-confirm",
    label: "Confirm booking",
    message: "I would like to confirm my booking details for this visit.",
  },
  {
    id: "add-symptom",
    label: "Add a symptom",
    message: "I want to add a symptom or concern for the workshop to review before my visit.",
  },
  {
    id: "change-time",
    label: "Change time",
    message: "I may need to change my preferred date or time.",
  },
  {
    id: "ask-price",
    label: "Rough price",
    message: "Can you give a rough idea of cost for the work I have booked?",
  },
];

/** @deprecated Gemini init paraphrase — workshop UI uses static intro instead. */
export const HERO_ADVISOR_OPENING_GUIDE = `${WORKSHOP_INTRO_TITLE}. ${WORKSHOP_INTRO_BODY} ${WORKSHOP_INTRO_PROMPT}`;

export const ADVISOR_MEDIA_HINT =
  "Photos or short clips help our technicians review the issue — not for a full diagnosis online.";
