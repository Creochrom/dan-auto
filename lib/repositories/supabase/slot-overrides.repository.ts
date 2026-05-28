/**
 * Supabase implementation of the slot_overrides repository.
 * Only active when STORAGE_BACKEND=supabase.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  SlotOverride,
  CreateSlotOverrideInput,
} from "@/lib/types/slot-availability";

type SlotOverrideRow = {
  date: string;
  is_closed: boolean;
  closed_slots: string[] | null;
  capacity: number | null;
  note: string | null;
  updated_at: string;
};

function toSlotOverride(row: SlotOverrideRow): SlotOverride {
  return {
    date: row.date,
    isClosed: row.is_closed,
    closedSlots: row.closed_slots,
    capacity: row.capacity,
    note: row.note,
    updatedAt: row.updated_at,
  };
}

export const supabaseSlotOverridesRepository = {
  async findByDate(date: string): Promise<SlotOverride | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("slot_overrides")
      .select("*")
      .eq("date", date)
      .maybeSingle();

    if (error) throw new Error(`[slot_overrides] findByDate failed: ${error.message}`);
    if (!data) return null;

    return toSlotOverride(data as SlotOverrideRow);
  },

  async listRange(from: string, to: string): Promise<SlotOverride[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("slot_overrides")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true });

    if (error) throw new Error(`[slot_overrides] listRange failed: ${error.message}`);
    return (data as SlotOverrideRow[]).map(toSlotOverride);
  },

  async upsert(input: CreateSlotOverrideInput): Promise<SlotOverride> {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    const row: SlotOverrideRow = {
      date: input.date,
      is_closed: input.isClosed,
      closed_slots: input.closedSlots,
      capacity: input.capacity,
      note: input.note,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("slot_overrides")
      .upsert(row, { onConflict: "date" })
      .select()
      .single();

    if (error) throw new Error(`[slot_overrides] upsert failed: ${error.message}`);
    return toSlotOverride(data as SlotOverrideRow);
  },

  async deleteByDate(date: string): Promise<void> {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("slot_overrides")
      .delete()
      .eq("date", date);

    if (error) throw new Error(`[slot_overrides] deleteByDate failed: ${error.message}`);
  },
};
