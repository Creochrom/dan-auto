import {
  DvlaServiceError,
  type DvlaRawVehicle,
} from "@/lib/services/dvla/dvla.types";

const DVLA_VEHICLE_URL =
  "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

export async function fetchVehicleDetails(
  registrationNumber: string
): Promise<DvlaRawVehicle> {
  const apiKey = process.env.DVLA_API_KEY?.trim();
  if (!apiKey) {
    console.error("[dvla] DVLA_API_KEY is not configured");
    throw new DvlaServiceError("Vehicle lookup is temporarily unavailable", 503);
  }

  let response: Response;
  try {
    response = await fetch(DVLA_VEHICLE_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ registrationNumber }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[dvla] network error", registrationNumber, err);
    throw new DvlaServiceError("Unable to reach DVLA service", 502);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status === 404) {
      console.warn("[dvla] vehicle not found", registrationNumber);
      throw new DvlaServiceError("Registration not found", 404);
    }
    if (response.status === 400) {
      console.warn("[dvla] invalid registration", registrationNumber, body);
      throw new DvlaServiceError("Invalid registration number", 400);
    }
    console.error("[dvla] upstream error", response.status, registrationNumber, body);
    throw new DvlaServiceError("DVLA lookup failed", 502);
  }

  try {
    return (await response.json()) as DvlaRawVehicle;
  } catch (err) {
    console.error("[dvla] invalid JSON response", registrationNumber, err);
    throw new DvlaServiceError("Invalid DVLA response", 502);
  }
}
