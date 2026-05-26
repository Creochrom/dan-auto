/**
 * AI service advisor chat types — CRM, Gemini streaming, WhatsApp sync ready.
 */

import type { IntakeState, MechanicIntakeSummary, SuggestionChip } from "@/lib/types/intake";
import type { AdvisorEngine } from "@/lib/config/advisor";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { VehicleMemoryLookupResult } from "@/lib/types/vehicle-memory";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessageSource = "typed" | "quick_reply" | "system";

export type ChatMessageStatus = "sending" | "sent" | "failed";

/**
 * Canonical chat message — persisted server-side and mirrored client-side.
 * - `content`: text sent to the API / stored in CRM logs
 * - `displayContent`: bubble text (e.g. quick-reply label vs full phrase)
 */
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  displayContent?: string;
  source?: ChatMessageSource;
  status?: ChatMessageStatus;
  /** Quick replies that were offered after this assistant message */
  chipsSnapshot?: SuggestionChip[];
};

export type LeadDraft = {
  name?: string;
  phone?: string;
  email?: string;
  registration?: string;
  vehicleModel?: string;
  problemDescription?: string;
  preferredDate?: string;
  callbackWindow?: string;
  urgency?: string;
};

export type BookingChatContext = {
  service: string;
  preferredDate: string;
  preferredTime: string;
};

/** Client-side transcript mirror for persistence / hydration */
export type ChatTranscript = {
  sessionId: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ChatSession = {
  id: string;
  messages: ChatMessage[];
  leadDraft?: LeadDraft;
  intakeState?: IntakeState;
  mechanicSummary?: MechanicIntakeSummary;
  /** Gemini-maintained structured intake (parallel to legacy intakeState). */
  structuredIntake?: StructuredIntake;
  bookingContext?: BookingChatContext;
  leadCaptured?: boolean;
  /** Set after workshop email successfully sent */
  intakeEmailedAt?: string;
  intakeEmailId?: string;
  /**
   * Cached result of the most recent registration lookup for this session.
   * Carried across turns so we don't re-hit DVLA on every message.
   */
  vehicleMemory?: VehicleMemoryLookupResult;
  createdAt: string;
  updatedAt: string;
};

export type SendChatOptions = {
  /** Shown in the user bubble (defaults to content) */
  displayContent?: string;
  source?: ChatMessageSource;
  registration?: string;
};

export type ChatRequest = {
  sessionId?: string;
  message?: string;
  registration?: string;
  init?: boolean;
  bookingContext?: BookingChatContext;
};

export type ChatResponse = {
  sessionId: string;
  message: ChatMessage;
  /** Echo of the persisted user turn (for timeline sync) */
  userMessage?: ChatMessage;
  leadDraft?: LeadDraft;
  intakeState?: IntakeState;
  mechanicSummary?: MechanicIntakeSummary;
  suggestionChips?: SuggestionChip[];
  typingLabel?: string;
  intakeComplete?: boolean;
  /** True when intake email was already sent for this session */
  intakeEmailed?: boolean;
  structuredIntake?: StructuredIntake;
  /** Which engine produced this turn: gemini, rules, or unconfigured (missing API key). */
  advisorEngine?: AdvisorEngine | "unconfigured";
};
