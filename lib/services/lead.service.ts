import { leadsRepository } from "@/lib/repositories/leads.repository";
import type { CreateLeadInput, Lead } from "@/lib/types/lead";

export const leadService = {
  list(): Promise<Lead[]> {
    return leadsRepository.list();
  },

  create(input: CreateLeadInput): Promise<Lead> {
    return leadsRepository.create(input);
  },
};
