import { stripPlate } from "@/lib/format-plate";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UpsertVehicleInput, Vehicle } from "@/lib/types/workshop-data";

type VehicleRow = {
  id: string;
  registration: string;
  registration_canonical: string;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  vin: string | null;
  created_at: string;
  updated_at: string;
};

function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    registration: row.registration,
    registrationCanonical: row.registration_canonical,
    make: row.make ?? undefined,
    model: row.model ?? undefined,
    year: row.year ?? undefined,
    colour: row.colour ?? undefined,
    vin: row.vin ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function vehicleId(registration: string) {
  return `veh_${stripPlate(registration).toLowerCase()}`;
}

export const supabaseVehiclesRepository = {
  async findByRegistration(registration: string): Promise<Vehicle | undefined> {
    const supabase = getSupabaseServerClient();
    const canonical = stripPlate(registration);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("registration_canonical", canonical)
      .maybeSingle();
    if (error) throw new Error(`[vehicles] findByRegistration failed: ${error.message}`);
    if (!data) return undefined;
    return toVehicle(data as VehicleRow);
  },

  async upsert(input: UpsertVehicleInput): Promise<Vehicle> {
    const supabase = getSupabaseServerClient();
    const canonical = stripPlate(input.registration);
    const row = {
      id: vehicleId(canonical),
      registration: input.registration.trim().toUpperCase(),
      registration_canonical: canonical,
      make: input.make ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      colour: input.colour ?? null,
      vin: input.vin ?? null,
    };
    const { data, error } = await supabase
      .from("vehicles")
      .upsert(row, { onConflict: "registration_canonical" })
      .select("*")
      .single();
    if (error) throw new Error(`[vehicles] upsert failed: ${error.message}`);
    return toVehicle(data as VehicleRow);
  },
};
