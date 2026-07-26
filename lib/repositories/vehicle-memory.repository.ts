import { mockStore } from "@/lib/repositories/mock-store";
import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseVehicleMemoryRepository } from "@/lib/repositories/supabase/vehicle-memory.repository";
import { stripPlate, formatPlate } from "@/lib/format-plate";
import type {
  VehicleMemoryCustomer,
  VehicleMemoryFacts,
  VehicleMemoryIntake,
  VehicleMemoryRecord,
} from "@/lib/types/vehicle-memory";

const MAX_INTAKES_PER_VEHICLE = 10;

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

export const vehicleMemoryRepository = {
  async findByReg(reg: string): Promise<VehicleMemoryRecord | undefined> {
    if (getStorageBackend() === "supabase") return supabaseVehicleMemoryRepository.findByReg(reg);

    const canon = stripPlate(reg);
    if (!canon) return undefined;
    return mockStore.vehicleMemory.find((r) => r.reg === canon);
  },

  async seedFromLookup(
    reg: string,
    facts: Partial<VehicleMemoryFacts>
  ): Promise<VehicleMemoryRecord | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehicleMemoryRepository.seedFromLookup(reg, facts);
    }

    const canon = stripPlate(reg);
    if (!canon) return undefined;

    const now = new Date().toISOString();
    const existing = mockStore.vehicleMemory.find((r) => r.reg === canon);
    if (existing) {
      existing.vehicle = mergeFacts(existing.vehicle, facts);
      existing.lastSeenAt = now;
      return existing;
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
    mockStore.vehicleMemory.push(record);
    return record;
  },

  async upsertContact(
    reg: string,
    facts: Partial<VehicleMemoryFacts>,
    customer: Partial<VehicleMemoryCustomer>
  ): Promise<VehicleMemoryRecord | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehicleMemoryRepository.upsertContact(reg, facts, customer);
    }

    const canon = stripPlate(reg);
    if (!canon) return undefined;
    const now = new Date().toISOString();

    const existing = mockStore.vehicleMemory.find((r) => r.reg === canon);
    if (existing) {
      existing.vehicle = mergeFacts(existing.vehicle, facts);
      existing.customer = mergeCustomer(existing.customer, customer, now);
      existing.lastSeenAt = now;
      return existing;
    }

    const record: VehicleMemoryRecord = {
      reg: canon,
      regDisplay: formatPlate(canon),
      vehicle: mergeFacts(emptyFacts(), facts),
      customer: mergeCustomer(emptyCustomer(now), customer, now),
      intakes: [],
      firstSeenAt: now,
      lastSeenAt: now,
    };
    mockStore.vehicleMemory.push(record);
    return record;
  },

  async appendIntake(
    reg: string,
    intake: VehicleMemoryIntake
  ): Promise<VehicleMemoryRecord | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehicleMemoryRepository.appendIntake(reg, intake);
    }

    const canon = stripPlate(reg);
    if (!canon) return undefined;
    const record = mockStore.vehicleMemory.find((r) => r.reg === canon);
    if (!record) return undefined;
    record.intakes.unshift(intake);
    if (record.intakes.length > MAX_INTAKES_PER_VEHICLE) {
      record.intakes.length = MAX_INTAKES_PER_VEHICLE;
    }
    record.lastSeenAt = intake.at;
    return record;
  },

  async count(): Promise<number> {
    if (getStorageBackend() === "supabase") return supabaseVehicleMemoryRepository.count();
    return mockStore.vehicleMemory.length;
  },

  async list(): Promise<VehicleMemoryRecord[]> {
    if (getStorageBackend() === "supabase") return supabaseVehicleMemoryRepository.list();
    return [...mockStore.vehicleMemory];
  },
};
