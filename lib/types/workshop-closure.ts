/**
 * Workshop closure periods — inclusive date ranges when the workshop is closed.
 */

export type WorkshopClosure = {
  id: string;
  /** YYYY-MM-DD inclusive */
  startDate: string;
  /** YYYY-MM-DD inclusive */
  endDate: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkshopClosureInput = {
  startDate: string;
  endDate: string;
  reason?: string | null;
};

export type UpdateWorkshopClosureInput = {
  startDate?: string;
  endDate?: string;
  reason?: string | null;
};

/** Why a date is unavailable for booking. */
export type ClosedReasonKind = "sunday" | "closure" | "override" | "past";

export type ClosedReason = {
  kind: ClosedReasonKind;
  /** Customer-facing short label (tooltip / chip). */
  label: string;
  /** Longer assistant / API message. */
  message: string;
  /** Matching closure when kind === "closure". */
  closure?: WorkshopClosure;
};
