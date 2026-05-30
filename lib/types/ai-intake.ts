import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { BookingChatContext, ChatMessage, LeadDraft } from "@/lib/types/chat";
import type { IntakeSeverity, MechanicIntakeSummary, SymptomCategory, IntakeState } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import type { IntakeFileRef } from "@/lib/types/service-intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";
import type { WorkshopCaseSummary } from "@/lib/types/workshop-case-summary";

/**
 * Client-provided session state for workshop handoff when the serverless
 * instance no longer has the in-memory chat session (Vercel cold instances).
 */
export type AiIntakeSessionSnapshot = {
  messages: ChatMessage[];
  leadDraft?: LeadDraft;
  mechanicSummary?: MechanicIntakeSummary;
  structuredIntake?: StructuredIntake;
  intakeState?: IntakeState;
  advisorRoute?: AdvisorRouteContext;
  bookingContext?: BookingChatContext;
};

export type AiIntakeSubmitInput = {
  chatSessionId: string;
  uploadIds?: string[];
  /** Optional — overrides draft email */
  customerEmail?: string;
  /** Optional — merged into session before email (callback form). */
  customerName?: string;
  customerPhone?: string;
  preferredCallbackTime?: string;
  /** Fallback when server memory has no session (production serverless). */
  snapshot?: AiIntakeSessionSnapshot;
};

/** Customer's overall intent for this intake — drives workshop routing. */
export type IntakeIntent =
  | "book"
  | "callback"
  | "quote"
  | "info_only"
  | "unspecified";

/** Drivability — workshop needs this before deciding pickup / drive-in. */
export type IntakeDrivability =
  | "drives_normally"
  | "drivable_with_concern"
  | "avoid_driving"
  | "will_not_start"
  | "unknown";

export type AiIntakeWorkshopSummary = {
  /** Canonical mechanic-ready case — primary view in email and admin. */
  caseSummary: WorkshopCaseSummary;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  registration: string;
  vehicle?: string;
  vehicleEngine?: string;
  serviceRequested: string;
  symptoms: string;
  /** Dashboard warning lights customer mentioned (Engine, ABS, etc.). */
  warningLights: string[];
  /** Drivability snapshot for triage. */
  drivability: IntakeDrivability;
  drivabilityNote?: string;
  possibleCauses: string[];
  estimatedRange?: string;
  urgency: UrgencyLevel;
  severity?: IntakeSeverity;
  severityNote?: string;
  observations: string[];
  category?: SymptomCategory;
  clarificationNotes: string[];
  /** 1–2 sentence AI-authored summary the mechanic reads first. */
  aiSummary: string;
  /** AI-classified intent (book / callback / quote / info_only). */
  intent: IntakeIntent;
  /** Free-text preferred slot e.g. "Tomorrow afternoon". */
  preferredBookingTime?: string;
  callbackAvailability?: string;
  /** Split callback date part e.g. "today". */
  callbackPreferredDate?: string;
  /** Split callback time part e.g. "12pm". */
  callbackPreferredTime?: string;
  /** Why the customer wants a call back (distinct from symptom detail). */
  callbackReason?: string;
  /** Workshop-readable callback brief — never empty for callback intents. */
  callbackSummary: string;
  callbackRequested: boolean;
  bookingPreference?: {
    service: string;
    preferredDate: string;
    preferredTime: string;
  };
  uploadedFiles: IntakeFileRef[];
  transcript: ChatMessage[];
  chatSessionId: string;
  preparedAt: string;
  /** True when one or more critical fields (name/phone/symptoms) is missing. */
  partial: boolean;
  missingFields: string[];
};

export type AiIntakeSubmitResult = {
  leadId: string;
  submittedAt: string;
  emailSent: boolean;
  emailId?: string;
  emailProvider?: "resend" | "log";
  confirmationMessage: string;
  summary: AiIntakeWorkshopSummary;
};
