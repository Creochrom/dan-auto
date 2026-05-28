/**
 * Supabase implementation of the leads repository.
 * Mirrors the interface of lib/repositories/leads.repository.ts exactly.
 * Only active when STORAGE_BACKEND=supabase.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateLeadInput, Lead, LeadStatus } from "@/lib/types/lead";

/** DB row shape — snake_case as returned by PostgREST */
type LeadRow = {
  id: string;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string | null;
  registration: string | null;
  vehicle_model: string | null;
  problem_description: string | null;
  preferred_date: string | null;
  source: Lead["source"];
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    registration: row.registration ?? undefined,
    vehicleModel: row.vehicle_model ?? undefined,
    problemDescription: row.problem_description ?? undefined,
    preferredDate: row.preferred_date ?? undefined,
    source: row.source,
    aiSummary: row.ai_summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newId() {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const supabaseLeadsRepository = {
  async list(status?: LeadStatus): Promise<Lead[]> {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[leads] list failed: ${error.message}`);

    return (data as LeadRow[]).map(toLead);
  },

  async findById(id: string): Promise<Lead | undefined> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`[leads] findById failed: ${error.message}`);
    if (!data) return undefined;

    return toLead(data as LeadRow);
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const id = newId();

    const row: LeadRow = {
      id,
      status: "new",
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      registration: input.registration?.toUpperCase() ?? null,
      vehicle_model: input.vehicleModel ?? null,
      problem_description: input.problemDescription ?? null,
      preferred_date: input.preferredDate ?? null,
      source: input.source ?? "website",
      ai_summary: input.aiSummary ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`[leads] create failed: ${error.message}`);

    return toLead(data as LeadRow);
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`[leads] updateStatus failed: ${error.message}`);
    if (!data) return null;

    return toLead(data as LeadRow);
  },
};
