import type { ChatMessage } from "@/lib/types/chat";
import type { IntakeSeverity, SymptomCategory } from "@/lib/types/intake";
import type { IntakeFileRef } from "@/lib/types/service-intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";

export type AiIntakeSubmitInput = {
  chatSessionId: string;
  uploadIds?: string[];
  /** Optional — overrides draft email */
  customerEmail?: string;
  /** Optional — merged into session before email (callback form). */
  customerName?: string;
  customerPhone?: string;
  preferredCallbackTime?: string;
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
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  registration: string;
  vehicle?: string;
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
  emailId: string;
  confirmationMessage: string;
  summary: AiIntakeWorkshopSummary;
};
