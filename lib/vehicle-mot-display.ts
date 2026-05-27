import type { VehicleReport } from "@/lib/types/vehicle-report";

export const MOT_HISTORY_URL = "https://www.gov.uk/check-mot-history";

export function vehicleIdentity(report: VehicleReport): {
  title: string;
  meta: string;
} {
  const { profile } = report;
  const metaParts: string[] = [String(profile.year), profile.fuel];

  const engine = profile.engine.trim();
  if (engine.length > 0 && !engine.toLowerCase().includes("unavailable")) {
    const litres = engine.match(/[\d.]+L/i)?.[0];
    metaParts.push(litres ?? engine);
  }

  return {
    title: profile.makeModel,
    meta: metaParts.join(" • "),
  };
}

/** @deprecated Use vehicleIdentity */
export function vehicleQuickLabel(report: VehicleReport): {
  primary: string;
  secondary: string;
} {
  const { title, meta } = vehicleIdentity(report);
  return { primary: title, secondary: meta };
}

export function motCountdownDisplay(
  motDays: number,
  motStatus: "valid" | "due_soon" | "urgent"
): { headline: string } {
  if (motStatus === "urgent" || motDays <= 0) {
    return { headline: "MOT overdue" };
  }
  if (motDays === 1) {
    return { headline: "1 day left" };
  }
  if (motDays <= 45) {
    return { headline: `${motDays} days left` };
  }
  const months = Math.max(1, Math.round(motDays / 30));
  return {
    headline: months === 1 ? "1 month left" : `${months} months left`,
  };
}

export function formatMotDueDate(
  motExpiryDate: string | null | undefined,
  motDays: number
): string {
  if (motExpiryDate) {
    const parsed = new Date(motExpiryDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  if (motDays > 0) {
    const estimated = new Date();
    estimated.setDate(estimated.getDate() + motDays);
    return estimated.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return "Unavailable";
}

export function motCountdownLabel(
  motDays: number,
  motStatus: "valid" | "due_soon" | "urgent"
): string {
  if (motStatus === "urgent" || motDays <= 0) return "MOT overdue";
  if (motDays === 1) return "1 day left";
  if (motDays <= 45) return `${motDays} days left`;
  const months = Math.max(1, Math.round(motDays / 30));
  return months === 1 ? "MOT in 1 month" : `MOT in ${months} months`;
}
