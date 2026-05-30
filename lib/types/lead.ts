/**
 * Lead capture — CRM-ready structure.
 */

import type { WorkshopCaseSummary } from "@/lib/types/workshop-case-summary";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "closed"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
  status: LeadStatus;
  name: string;
  phone: string;
  email?: string;
  registration?: string;
  vehicleModel?: string;
  problemDescription?: string;
  preferredDate?: string;
  source: "website" | "assistant" | "contact_form" | "callback";
  aiSummary?: string;
  /** Parsed from ai_summary JSON when present (Release 0.2.4+). */
  caseSummary?: WorkshopCaseSummary;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeadInput = {
  name: string;
  phone: string;
  email?: string;
  registration?: string;
  vehicleModel?: string;
  problemDescription?: string;
  preferredDate?: string;
  source?: Lead["source"];
  aiSummary?: string;
  caseSummary?: WorkshopCaseSummary;
};
