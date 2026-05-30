import { getStorageBackend } from "@/lib/repositories/backend";
import { supabaseVehiclesRepository } from "@/lib/repositories/supabase/vehicles.repository";
import { stripPlate } from "@/lib/format-plate";
import type { UpsertVehicleInput, Vehicle } from "@/lib/types/workshop-data";

const mockVehicles = new Map<string, Vehicle>();

function vehicleId(registration: string) {
  return `veh_${stripPlate(registration)}`;
}

export const vehiclesRepository = {
  async findByRegistration(registration: string): Promise<Vehicle | undefined> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehiclesRepository.findByRegistration(registration);
    }
    return mockVehicles.get(stripPlate(registration));
  },

  async upsert(input: UpsertVehicleInput): Promise<Vehicle> {
    if (getStorageBackend() === "supabase") {
      return supabaseVehiclesRepository.upsert(input);
    }
    const now = new Date().toISOString();
    const canonical = stripPlate(input.registration);
    const prev = mockVehicles.get(canonical);
    const vehicle: Vehicle = {
      id: vehicleId(canonical),
      registration: input.registration.trim().toUpperCase(),
      registrationCanonical: canonical,
      make: input.make ?? prev?.make,
      model: input.model ?? prev?.model,
      year: input.year ?? prev?.year,
      colour: input.colour ?? prev?.colour,
      vin: input.vin ?? prev?.vin,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    };
    mockVehicles.set(canonical, vehicle);
    return vehicle;
  },
};
