/**
 * Supabase implementation of workshop_closures repository.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateWorkshopClosureInput,
  UpdateWorkshopClosureInput,
  WorkshopClosure,
} from "@/lib/types/workshop-closure";

type ClosureRow = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

function toClosure(row: ClosureRow): WorkshopClosure {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supabaseWorkshopClosuresRepository = {
  async listAll(): Promise<WorkshopClosure[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workshop_closures")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) throw new Error(`[workshop_closures] listAll failed: ${error.message}`);
    return (data as ClosureRow[]).map(toClosure);
  },

  async listOverlapping(from: string, to: string): Promise<WorkshopClosure[]> {
    const supabase = getSupabaseServerClient();
    // Ranges overlap when start_date <= to AND end_date >= from.
    const { data, error } = await supabase
      .from("workshop_closures")
      .select("*")
      .lte("start_date", to)
      .gte("end_date", from)
      .order("start_date", { ascending: true });

    if (error) {
      throw new Error(`[workshop_closures] listOverlapping failed: ${error.message}`);
    }
    return (data as ClosureRow[]).map(toClosure);
  },

  async findCoveringDate(date: string): Promise<WorkshopClosure | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workshop_closures")
      .select("*")
      .lte("start_date", date)
      .gte("end_date", date)
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`[workshop_closures] findCoveringDate failed: ${error.message}`);
    }
    if (!data) return null;
    return toClosure(data as ClosureRow);
  },

  async create(input: CreateWorkshopClosureInput): Promise<WorkshopClosure> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("workshop_closures")
      .insert({
        start_date: input.startDate,
        end_date: input.endDate,
        reason: input.reason?.trim() || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(`[workshop_closures] create failed: ${error.message}`);
    return toClosure(data as ClosureRow);
  },

  async update(id: string, input: UpdateWorkshopClosureInput): Promise<WorkshopClosure | null> {
    const supabase = getSupabaseServerClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.startDate !== undefined) patch.start_date = input.startDate;
    if (input.endDate !== undefined) patch.end_date = input.endDate;
    if (input.reason !== undefined) patch.reason = input.reason?.trim() || null;

    const { data, error } = await supabase
      .from("workshop_closures")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`[workshop_closures] update failed: ${error.message}`);
    if (!data) return null;
    return toClosure(data as ClosureRow);
  },

  async deleteById(id: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workshop_closures")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(`[workshop_closures] delete failed: ${error.message}`);
    return Boolean(data);
  },
};
