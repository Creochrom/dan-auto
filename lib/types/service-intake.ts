/**
 * Structured service intake summary — workshop, CRM, and email handoff.
 */

import type { IntakeSeverity } from "@/lib/types/intake";
import type { UploadCategory } from "@/lib/types/upload";

export type UrgencyLevel = "low" | "medium" | "high";

export type BookingSlotSelection = {
  service: string;
  preferredDate: string;
  preferredTime: string;
};

export type IntakeFileRef = {
  id: string;
  fileName: string;
  mimeType: string;
  category: UploadCategory;
};

export type ServiceIntakeSummary = {
  customerName: string;
  customerPhone: string;
  registration: string;
  vehicle?: string;
  bookingSlot: BookingSlotSelection;
  symptoms: string;
  possibleCauses: string[];
  estimatedRange?: string;
  uploadedFiles: IntakeFileRef[];
  callbackAvailability?: string;
  urgency: UrgencyLevel;
  severity?: IntakeSeverity;
  severityNote?: string;
  chatSessionId?: string;
  preparedAt: string;
};

export type CompleteBookingIntakeInput = {
  service: string;
  preferredDate: string;
  preferredTime: string;
  chatSessionId: string;
  uploadIds?: string[];
  registration?: string;
};

export type CompleteBookingIntakeResult = {
  bookingId: string;
  intakeSummary: ServiceIntakeSummary;
  emailPrepared: boolean;
};
