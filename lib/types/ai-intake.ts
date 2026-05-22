import type { ChatMessage } from "@/lib/types/chat";
import type { IntakeSeverity, SymptomCategory } from "@/lib/types/intake";
import type { IntakeFileRef } from "@/lib/types/service-intake";
import type { UrgencyLevel } from "@/lib/types/service-intake";

export type AiIntakeSubmitInput = {
  chatSessionId: string;
  uploadIds?: string[];
  /** Optional — overrides draft email */
  customerEmail?: string;
};

export type AiIntakeWorkshopSummary = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  registration: string;
  vehicle?: string;
  serviceRequested: string;
  symptoms: string;
  possibleCauses: string[];
  estimatedRange?: string;
  urgency: UrgencyLevel;
  severity?: IntakeSeverity;
  severityNote?: string;
  observations: string[];
  category?: SymptomCategory;
  clarificationNotes: string[];
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
};

export type AiIntakeSubmitResult = {
  emailId: string;
  confirmationMessage: string;
  summary: AiIntakeWorkshopSummary;
};
