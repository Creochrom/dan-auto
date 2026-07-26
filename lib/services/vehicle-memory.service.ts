import { lookupVehicle } from "@/lib/vehicle-lookup-server";
import { vehicleMemoryRepository } from "@/lib/repositories/vehicle-memory.repository";
import { formatPlate, stripPlate } from "@/lib/format-plate";
import type { AiIntakeWorkshopSummary } from "@/lib/types/ai-intake";
import type {
  VehicleMemoryFacts,
  VehicleMemoryIntake,
  VehicleMemoryLookupResult,
} from "@/lib/types/vehicle-memory";

const MAX_RECENT_INTAKES = 3;

/**
 * Split a "MAKE MODEL TRIM…" string into a best-effort `{ make, model }`.
 * Falls back to dumping everything into `model` when we can't split cleanly.
 */
function splitMakeModel(makeModel: string): { make: string; model: string } {
  const parts = makeModel.trim().split(/\s+/);
  if (parts.length === 0) return { make: "", model: "" };
  if (parts.length === 1) return { make: parts[0], model: "" };
  return { make: parts[0], model: parts.slice(1).join(" ") };
}

async function factsFromDvla(reg: string): Promise<VehicleMemoryFacts | undefined> {
  let payload;
  try {
    payload = await lookupVehicle(reg);
  } catch {
    return undefined;
  }
  if (!payload?.matched) return undefined;
  const p = payload.report.profile;
  const { make, model } = splitMakeModel(p.makeModel);
  return {
    make,
    model,
    year: p.year ? String(p.year) : "",
    fuel: p.fuel ?? "",
    engine: p.engine ?? "",
    motStatus: p.motStatus,
    motExpiryDate: p.motExpiryDate ?? undefined,
    taxStatus: p.taxStatus,
    motHealthSummary: payload.report.motHealthSummary,
    lastMotResult: payload.report.lastMot?.result,
    lastMotAdvisoryCount: payload.report.lastMot?.advisoryCount,
    recurringMotThemes: payload.report.motHistoryAvailable
      ? payload.report.motHealthSummary
          .filter((line) => line.toLowerCase().includes("repeated"))
          .slice(0, 2)
      : undefined,
  };
}

export const vehicleMemoryService = {
  /**
   * Look up a registration: DVLA first, then memory.
   *
   * - Always tries DVLA — fills in the make/model/fuel/year for the AI.
   * - Always seeds a memory record (without customer info) so that the
   *   *next* visit will be a returning customer.
   * - When a memory record already existed, marks the result `returning`
   *   and surfaces the known customer + recent intakes for the AI.
   */
  async lookup(reg: string): Promise<VehicleMemoryLookupResult> {
    const canon = stripPlate(reg);
    if (!canon) {
      return { returning: false, recentIntakes: [], dvlaMatched: false };
    }

    const dvlaFacts = await factsFromDvla(canon);
    const dvlaMatched = Boolean(dvlaFacts);

    const existing = await vehicleMemoryRepository.findByReg(canon);
    const returning = Boolean(
      existing &&
        (existing.intakes.length > 0 ||
          existing.customer.name ||
          existing.customer.phone)
    );

    // Seed (or refresh) the memory record so the AI builds a profile over
    // time even when the customer never completes an intake.
    if (dvlaFacts) {
      await vehicleMemoryRepository.seedFromLookup(canon, dvlaFacts);
    }

    const record = (await vehicleMemoryRepository.findByReg(canon)) ?? existing;

    return {
      reg: canon,
      regDisplay: formatPlate(canon),
      returning,
      vehicle: record?.vehicle ?? dvlaFacts,
      customer: returning ? record?.customer : undefined,
      recentIntakes: returning
        ? (record?.intakes ?? []).slice(0, MAX_RECENT_INTAKES)
        : [],
      dvlaMatched,
    };
  },

  /**
   * Persist the just-emailed workshop intake into the vehicle memory so the
   * next visit is recognised. Tolerates partial data — only writes fields
   * that have actual values.
   */
  async recordIntake(summary: AiIntakeWorkshopSummary): Promise<void> {
    const reg = stripPlate(summary.registration ?? "");
    if (!reg || reg === "TBC") return;

    const { make, model } = splitMakeModel(summary.vehicle ?? "");

    await vehicleMemoryRepository.upsertContact(
      reg,
      { make, model },
      {
        name: summary.customerName !== "Not provided" ? summary.customerName : "",
        phone: summary.customerPhone !== "Not provided" ? summary.customerPhone : "",
        email: summary.customerEmail ?? "",
      }
    );

    const intake: VehicleMemoryIntake = {
      at: summary.preparedAt,
      summary: summary.aiSummary || summary.symptoms,
      symptoms:
        summary.symptoms && summary.symptoms !== "Not specified — see transcript"
          ? summary.symptoms.split(/;\s*/).filter(Boolean)
          : [],
      urgency: summary.urgency,
      callbackRequested: summary.callbackRequested,
      chatSessionId: summary.chatSessionId,
    };
    await vehicleMemoryRepository.appendIntake(reg, intake);
  },
};
