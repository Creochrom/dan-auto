import { mockStore } from "@/lib/repositories/mock-store";
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
    taxStatus: incoming.taxStatus?.trim() || base.taxStatus,
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
  /** Lookup by raw or canonical registration. Returns undefined when unknown. */
  findByReg(reg: string): VehicleMemoryRecord | undefined {
    const canon = stripPlate(reg);
    if (!canon) return undefined;
    return mockStore.vehicleMemory.find((r) => r.reg === canon);
  },

  /**
   * Seed a record from a DVLA lookup (no customer/intake yet) so we can
   * recognise this vehicle when the same plate is entered later.
   */
  seedFromLookup(reg: string, facts: Partial<VehicleMemoryFacts>): VehicleMemoryRecord | undefined {
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

  /** Upsert customer details + vehicle facts (called when intake is sent). */
  upsertContact(
    reg: string,
    facts: Partial<VehicleMemoryFacts>,
    customer: Partial<VehicleMemoryCustomer>
  ): VehicleMemoryRecord | undefined {
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

  /** Append a new intake to the vehicle's history. */
  appendIntake(reg: string, intake: VehicleMemoryIntake): VehicleMemoryRecord | undefined {
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

  /** Debug / admin helpers. */
  count(): number {
    return mockStore.vehicleMemory.length;
  },
  list(): VehicleMemoryRecord[] {
    return [...mockStore.vehicleMemory];
  },
};
