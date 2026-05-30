/**
 * Structured service intake summary — workshop, CRM, and email handoff.
 */

import type { IntakeSeverity } from "@/lib/types/intake";
import type { UploadCategory } from "@/lib/types/upload";
import type { WorkshopCaseSummary } from "@/lib/types/workshop-case-summary";

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
  /** Canonical mechanic-ready case — primary view in email and admin. */
  caseSummary: WorkshopCaseSummary;
  customerName: string;
  customerPhone: string;
  registration: string;
  vehicle?: string;
  vehicleEngine?: string;
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
  /** Sync onto session before submit when client has fresher contact details. */
  customerName?: string;
  customerPhone?: string;
  /** Correlates structured BOOKING_TRACE logs across client and server. */
  traceId?: string;
};

export type CompleteBookingIntakeResult = {
  bookingId: string;
  /** Booking row persisted successfully — primary success criterion. */
  bookingCreated: true;
  /** Workshop notification email delivered. */
  notificationSent: boolean;
  intakeSummary: ServiceIntakeSummary;
  /** @deprecated Use notificationSent */
  emailPrepared: boolean;
  /** @deprecated Use notificationSent */
  emailSent: boolean;
  emailId?: string;
  /** Present when bookingCreated but notificationSent is false. */
  notificationWarning?: string;
};
