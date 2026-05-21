import { leadsRepository } from "@/lib/repositories/leads.repository";
import type { CreateLeadInput, Lead } from "@/lib/types/lead";

export const leadService = {
  list() {
    return leadsRepository.list();
  },

  create(input: CreateLeadInput): Lead {
    return leadsRepository.create(input);
  },
};
