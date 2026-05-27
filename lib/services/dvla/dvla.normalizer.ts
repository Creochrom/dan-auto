import type { DvlaRawVehicle, NormalizedDvlaVehicle } from "@/lib/services/dvla/dvla.types";

const UNKNOWN = "Unknown";

function str(value: unknown, fallback = UNKNOWN): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function year(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 1900) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 1900) return n;
  }
  return new Date().getFullYear();
}

export function normalizeDvlaVehicle(
  raw: DvlaRawVehicle,
  registrationNumber: string
): NormalizedDvlaVehicle {
  return {
    registrationNumber,
    make: str(raw.make),
    fuelType: str(raw.fuelType),
    motStatus: str(raw.motStatus, "No details held"),
    taxStatus: str(raw.taxStatus, "Unknown"),
    yearOfManufacture: year(raw.yearOfManufacture),
    colour: str(raw.colour),
    motExpiryDate:
      typeof raw.motExpiryDate === "string" && raw.motExpiryDate.trim()
        ? raw.motExpiryDate.trim()
        : null,
    engineCapacity:
      typeof raw.engineCapacity === "number" && Number.isFinite(raw.engineCapacity)
        ? raw.engineCapacity
        : null,
  };
}
