/**
 * Lead capture — CRM-ready structure.
 */

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
};
