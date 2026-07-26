/**
 * Supabase implementation of the vehicle memory repository.
 * Mirrors the interface of lib/repositories/vehicle-memory.repository.ts exactly.
 * Only active when STORAGE_BACKEND=supabase.
 *
 * vehicle / customer / intakes are stored as JSONB — schema changes to those
 * nested types never require a migration.  Mutation methods use application-
 * level read-modify-write to preserve the same merge semantics as the mock.
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { stripPlate, formatPlate } from "@/lib/format-plate";
import type {
  VehicleMemoryCustomer,
  VehicleMemoryFacts,
  VehicleMemoryIntake,
  VehicleMemoryRecord,
} from "@/lib/types/vehicle-memory";

const MAX_INTAKES_PER_VEHICLE = 10;

type VehicleMemoryRow = {
  reg: string;
  reg_display: string;
  vehicle: VehicleMemoryFacts;
  customer: VehicleMemoryCustomer;
  intakes: VehicleMemoryIntake[];
  first_seen_at: string;
  last_seen_at: string;
};

function toRecord(row: VehicleMemoryRow): VehicleMemoryRecord {
  return {
    reg: row.reg,
    regDisplay: row.reg_display,
    vehicle: row.vehicle,
    customer: row.customer,
    intakes: row.intakes ?? [],
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

function emptyFacts(): VehicleMemoryFacts {
  return { make: "", model: "", year: "", fuel: "", engine: "" };
}

function emptyCustomer(now: string): VehicleMemoryCustomer {
  return { name: "", phone: "", email: "", lastSeenAt: now };
}

function mergeFacts(
  base: VehicleMemoryFacts,
  incoming: Partial<VehicleMemoryFacts> | undefined
): VehicleMemoryFacts {
  if (!incoming) return base;
  return {
    make: incoming.make?.trim() || base.make,
    model: incoming.model?.trim() || base.model,
    year: incoming.year?.trim() || base.year,
    fuel: incoming.fuel?.trim() || base.fuel,
    engine: incoming.engine?.trim() || base.engine,
    motStatus: incoming.motStatus?.trim() || base.motStatus,
    motExpiryDate: incoming.motExpiryDate?.trim() || base.motExpiryDate,
    taxStatus: incoming.taxStatus?.trim() || base.taxStatus,
    motHealthSummary: incoming.motHealthSummary?.length
      ? incoming.motHealthSummary
      : base.motHealthSummary,
    lastMotResult: incoming.lastMotResult?.trim() || base.lastMotResult,
    lastMotAdvisoryCount:
      incoming.lastMotAdvisoryCount ?? base.lastMotAdvisoryCount,
    recurringMotThemes: incoming.recurringMotThemes?.length
      ? incoming.recurringMotThemes
      : base.recurringMotThemes,
  };
}

function mergeCustomer(
  base: VehicleMemoryCustomer,
  incoming: Partial<VehicleMemoryCustomer> | undefined,
  now: string
): VehicleMemoryCustomer {
  if (!incoming) return { ...base, lastSeenAt: now };
  return {
    name: incoming.name?.trim() || base.name,
    phone: incoming.phone?.trim() || base.phone,
    email: incoming.email?.trim() || base.email,
    lastSeenAt: now,
  };
}

async function getRecord(reg: string): Promise<VehicleMemoryRecord | undefined> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicle_memory")
    .select("*")
    .eq("reg", reg)
    .maybeSingle();

  if (error) throw new Error(`[vehicle_memory] findByReg failed: ${error.message}`);
  if (!data) return undefined;
  return toRecord(data as VehicleMemoryRow);
}

async function upsertRow(row: VehicleMemoryRow): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("vehicle_memory")
    .upsert(row, { onConflict: "reg" });
  if (error) throw new Error(`[vehicle_memory] upsert failed: ${error.message}`);
}

export const supabaseVehicleMemoryRepository = {
  async findByReg(reg: string): Promise<VehicleMemoryRecord | undefined> {
    const canon = stripPlate(reg);
    if (!canon) return undefined;
    return getRecord(canon);
  },

  async seedFromLookup(
    reg: string,
    facts: Partial<VehicleMemoryFacts>
  ): Promise<VehicleMemoryRecord | undefined> {
    const canon = stripPlate(reg);
    if (!canon) return undefined;

    const now = new Date().toISOString();
    const existing = await getRecord(canon);
    if (existing) {
      const updated: VehicleMemoryRecord = {
        ...existing,
        vehicle: mergeFacts(existing.vehicle, facts),
        lastSeenAt: now,
      };
      await upsertRow({
        reg: updated.reg,
        reg_display: updated.regDisplay,
        vehicle: updated.vehicle,
        customer: updated.customer,
        intakes: updated.intakes,
        first_seen_at: updated.firstSeenAt,
        last_seen_at: now,
      });
      return updated;
    }

    const record: VehicleMemoryRecord = {
      reg: canon,
      regDisplay: formatPlate(canon),
      vehicle: mergeFacts(emptyFacts(), facts),
      customer: emptyCustomer(now),
      intakes: [],
      firstSeenAt: now,
      lastSeenAt: now,
    };
    await upsertRow({
      reg: record.reg,
      reg_display: record.regDisplay,
      vehicle: record.vehicle,
      customer: record.customer,
      intakes: [],
      first_seen_at: now,
      last_seen_at: now,
    });
    return record;
  },

  async upsertContact(
    reg: string,
    facts: Partial<VehicleMemoryFacts>,
    customer: Partial<VehicleMemoryCustomer>
  ): Promise<VehicleMemoryRecord | undefined> {
    const canon = stripPlate(reg);
    if (!canon) return undefined;

    const now = new Date().toISOString();
    const existing = await getRecord(canon);

    const record: VehicleMemoryRecord = existing
      ? {
          ...existing,
          vehicle: mergeFacts(existing.vehicle, facts),
          customer: mergeCustomer(existing.customer, customer, now),
          lastSeenAt: now,
        }
      : {
          reg: canon,
          regDisplay: formatPlate(canon),
          vehicle: mergeFacts(emptyFacts(), facts),
          customer: mergeCustomer(emptyCustomer(now), customer, now),
          intakes: [],
          firstSeenAt: now,
          lastSeenAt: now,
        };

    await upsertRow({
      reg: record.reg,
      reg_display: record.regDisplay,
      vehicle: record.vehicle,
      customer: record.customer,
      intakes: record.intakes,
      first_seen_at: record.firstSeenAt,
      last_seen_at: now,
    });
    return record;
  },

  async appendIntake(
    reg: string,
    intake: VehicleMemoryIntake
  ): Promise<VehicleMemoryRecord | undefined> {
    const canon = stripPlate(reg);
    if (!canon) return undefined;

    const record = await getRecord(canon);
    if (!record) return undefined;

    const intakes = [intake, ...record.intakes].slice(0, MAX_INTAKES_PER_VEHICLE);
    const updated: VehicleMemoryRecord = { ...record, intakes, lastSeenAt: intake.at };

    await upsertRow({
      reg: updated.reg,
      reg_display: updated.regDisplay,
      vehicle: updated.vehicle,
      customer: updated.customer,
      intakes,
      first_seen_at: updated.firstSeenAt,
      last_seen_at: intake.at,
    });
    return updated;
  },

  async count(): Promise<number> {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from("vehicle_memory")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error(`[vehicle_memory] count failed: ${error.message}`);
    return count ?? 0;
  },

  async list(): Promise<VehicleMemoryRecord[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("vehicle_memory")
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) throw new Error(`[vehicle_memory] list failed: ${error.message}`);
    return (data as VehicleMemoryRow[]).map(toRecord);
  },
};
