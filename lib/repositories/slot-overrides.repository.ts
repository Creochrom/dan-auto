/**
 * Facade repository for slot_overrides.
 * Delegates to Supabase when STORAGE_BACKEND=supabase,
 * otherwise falls back to an in-memory mock (returns null / empty arrays).
 */

import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseSlotOverridesRepository } from "@/lib/repositories/supabase/slot-overrides.repository";
import type {
  SlotOverride,
  CreateSlotOverrideInput,
} from "@/lib/types/slot-availability";

/** Tiny in-memory mock — used only when STORAGE_BACKEND=mock. */
const mockOverrides = new Map<string, SlotOverride>();

export const slotOverridesRepository = {
  async findByDate(date: string): Promise<SlotOverride | null> {
    if (getStorageBackend() === "supabase") {
      return supabaseSlotOverridesRepository.findByDate(date);
    }
    return mockOverrides.get(date) ?? null;
  },

  async listRange(from: string, to: string): Promise<SlotOverride[]> {
    if (getStorageBackend() === "supabase") {
      return supabaseSlotOverridesRepository.listRange(from, to);
    }
    return [...mockOverrides.values()].filter((o) => o.date >= from && o.date <= to);
  },

  async upsert(input: CreateSlotOverrideInput): Promise<SlotOverride> {
    if (getStorageBackend() === "supabase") {
      return supabaseSlotOverridesRepository.upsert(input);
    }
    const override: SlotOverride = { ...input, updatedAt: new Date().toISOString() };
    mockOverrides.set(input.date, override);
    return override;
  },

  async deleteByDate(date: string): Promise<void> {
    if (getStorageBackend() === "supabase") {
      return supabaseSlotOverridesRepository.deleteByDate(date);
    }
    mockOverrides.delete(date);
  },
};
