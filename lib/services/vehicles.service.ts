import { vehiclesRepository } from "@/lib/repositories/vehicles.repository";
import type { UpsertVehicleInput, Vehicle } from "@/lib/types/workshop-data";

export const vehiclesService = {
  findByRegistration(registration: string): Promise<Vehicle | undefined> {
    return vehiclesRepository.findByRegistration(registration);
  },

  upsert(input: UpsertVehicleInput): Promise<Vehicle> {
    return vehiclesRepository.upsert(input);
  },
};
