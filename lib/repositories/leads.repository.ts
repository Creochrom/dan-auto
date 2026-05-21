import { mockStore } from "@/lib/repositories/mock-store";
import type { CreateLeadInput, Lead, LeadStatus } from "@/lib/types/lead";

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const leadsRepository = {
  list(status?: LeadStatus): Lead[] {
    const all = [...mockStore.leads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return status ? all.filter((l) => l.status === status) : all;
  },

  findById(id: string): Lead | undefined {
    return mockStore.leads.find((l) => l.id === id);
  },

  create(input: CreateLeadInput): Lead {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: newId("lead"),
      status: "new",
      name: input.name,
      phone: input.phone,
      email: input.email,
      registration: input.registration?.toUpperCase(),
      vehicleModel: input.vehicleModel,
      problemDescription: input.problemDescription,
      preferredDate: input.preferredDate,
      source: input.source ?? "website",
      aiSummary: input.aiSummary,
      createdAt: now,
      updatedAt: now,
    };
    mockStore.leads.push(lead);
    return lead;
  },
};
