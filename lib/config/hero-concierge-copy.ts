import {
  CalendarClock,
  CircleHelp,
  MessageSquareWarning,
  PhoneCall,
  PoundSterling,
  ShieldCheck,
} from "lucide-react";
import type { HeroIntentCard } from "@/lib/types/hero-concierge";
import type { QuickStartAction } from "@/lib/config/advisor-copy";

/** Primary conversational prompt — shown after the welcome intro. */
export const CONCIERGE_HUB_PROMPT = "What would you like help with today?";

export const CONCIERGE_PROMPT_HINT =
  "Choose a direction below, or describe it in your own words.";

/** Capability overview — warm advisor tone, not a feature list. */
export const CONCIERGE_INTRO_BODY =
  "I can help with warning lights, unusual noises, running issues, MOT questions, repair guidance, bookings and workshop support.";

export const CONCIERGE_INTRO_BODY_FIRST_VISIT =
  "I'm here to help with warning lights, unusual noises, running issues, MOT questions, repair guidance, bookings and workshop support.";

export function conciergeGreeting(customerName?: string, returning?: boolean): string {
  const first = conciergeFirstName(customerName);
  if (first && returning) return `Welcome back, ${first}.`;
  if (first) return `Good to meet you, ${first}.`;
  if (returning) return "Welcome back.";
  return "Good to have you here.";
}

export function conciergeFirstName(fullName?: string): string {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) return "";
  const [first] = trimmed.split(/\s+/);
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : trimmed;
}

/** @deprecated Use CONCIERGE_HUB_PROMPT */
export const CONCIERGE_HUB_HEADLINE = CONCIERGE_HUB_PROMPT;

/** @deprecated Use CONCIERGE_PROMPT_HINT */
export const CONCIERGE_HUB_SUBLINE = CONCIERGE_PROMPT_HINT;

export const CONCIERGE_RESET_GREETING = "Welcome back. What would you like help with today?";

export const HERO_INTENT_CARDS: HeroIntentCard[] = [
  {
    id: "diagnostic",
    mode: "diagnostic",
    title: "Discuss a vehicle issue",
    description: "Warning lights, noises, smoke and running issues",
    icon: MessageSquareWarning,
    message:
      "I would like help understanding a problem with my vehicle — symptoms, warning lights or how it is running.",
  },
  {
    id: "pricing",
    mode: "pricing",
    title: "Repair cost guidance",
    description: "Rough local ranges and what affects the quote",
    icon: PoundSterling,
    message:
      "I would like rough UK repair cost guidance for my vehicle — what might affect the price and how quotes can vary.",
  },
  {
    id: "callback",
    mode: "callback",
    title: "Mechanic callback",
    description: "A technician reviews your case and calls back",
    icon: PhoneCall,
    message:
      "I would like a mechanic from Dan Auto Centre to call me back about my vehicle.",
  },
  {
    id: "booking",
    mode: "booking",
    title: "Book MOT or service",
    description: "Find the right visit and move toward booking",
    icon: CalendarClock,
    message:
      "I would like help choosing the right MOT or service booking for my vehicle.",
  },
  {
    id: "quick_question",
    mode: "quick_question",
    title: "Quick question",
    description: "Urgency, timing, ballpark costs or MOT advice",
    icon: CircleHelp,
    message:
      "I have a quick question about my vehicle — for example whether something can wait or how long work might take.",
  },
  {
    id: "safe_to_drive",
    mode: "quick_question",
    title: "Is it safe to drive?",
    description: "Whether to stop driving or book in soon",
    icon: ShieldCheck,
    message:
      "I need honest guidance on whether my vehicle is safe to drive right now, or if I should stop and arrange inspection.",
  },
];

export const DIAGNOSTIC_TOPICS_HEADLINE = "What best describes the issue?";

export const DIAGNOSTIC_TOPICS_SUBLINE =
  "Pick the closest match — you can add more detail in chat.";

/** Symptom topics — only shown after diagnostic intent is chosen. */
export const DIAGNOSTIC_TOPIC_ACTIONS: QuickStartAction[] = [
  {
    id: "warning-light",
    label: "Warning light",
    message:
      "A dashboard warning light has come on and I need calm guidance on what to do next.",
  },
  {
    id: "strange-noise",
    label: "Unusual noise",
    message:
      "There is an unusual noise from the vehicle that I would like help understanding.",
  },
  {
    id: "brake-problem",
    label: "Brakes",
    message:
      "I am having a brake-related concern and need guidance before booking in.",
  },
  {
    id: "car-shaking",
    label: "Shaking / vibration",
    message:
      "The car is shaking or vibrating in a way that does not feel normal.",
  },
  {
    id: "overheating",
    label: "Overheating",
    message:
      "The vehicle has overheated or the temperature warning has come on.",
  },
  {
    id: "engine-issue",
    label: "Engine / running",
    message:
      "There is an engine-related problem — power loss, rough running or a warning light.",
  },
  {
    id: "smoke-smell",
    label: "Smoke or smell",
    message:
      "I have noticed smoke, a burning smell or an unusual odour from the vehicle.",
  },
  {
    id: "mot-advice",
    label: "MOT concern",
    message:
      "I need MOT-related advice — advisories, preparation or booking guidance.",
  },
];

export const ESCALATION_OFFER_TITLE =
  "Would you like me to prepare this for mechanic review?";

export const WORKSHOP_SUBMIT_SUCCESS = `Perfect — I've prepared your workshop intake and sent it to the Dan Auto Centre team.

A mechanic will review the information and contact you shortly.

Need help with anything else regarding your vehicle?`;

export const CALLBACK_FORM_TITLE = "Workshop callback";

export const CALLBACK_FORM_HINT =
  "We will send your conversation summary to the workshop — nothing is sent until you confirm below.";
