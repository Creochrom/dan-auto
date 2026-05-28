import { leadsRepository } from "@/lib/repositories/leads.repository";
import type { CreateLeadInput, Lead, LeadStatus } from "@/lib/types/lead";

export const leadService = {
  list(): Promise<Lead[]> {
    return leadsRepository.list();
  },

  create(input: CreateLeadInput): Promise<Lead> {
    return leadsRepository.create(input);
  },

  updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return leadsRepository.updateStatus(id, status);
  },
};
