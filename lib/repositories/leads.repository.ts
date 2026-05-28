import { mockStore } from "@/lib/repositories/mock-store";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseLeadsRepository } from "@/lib/repositories/supabase/leads.repository";
import type { CreateLeadInput, Lead, LeadStatus } from "@/lib/types/lead";

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const leadsRepository = {
  async list(status?: LeadStatus): Promise<Lead[]> {
    if (getStorageBackend() === "supabase") return supabaseLeadsRepository.list(status);

    const all = [...mockStore.leads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return status ? all.filter((l) => l.status === status) : all;
  },

  async findById(id: string): Promise<Lead | undefined> {
    if (getStorageBackend() === "supabase") return supabaseLeadsRepository.findById(id);

    return mockStore.leads.find((l) => l.id === id);
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    if (getStorageBackend() === "supabase") return supabaseLeadsRepository.create(input);

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

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseLeadsRepository.updateStatus(id, status);
    }

    const lead = mockStore.leads.find((l) => l.id === id);
    if (!lead) return null;
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    return lead;
  },
};
