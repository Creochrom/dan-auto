import type { VehicleReport } from "@/lib/types/vehicle-report";

export const MOT_HISTORY_URL = "https://www.gov.uk/check-mot-history";

export function vehicleQuickLabel(report: VehicleReport): {
  primary: string;
  secondary: string;
} {
  const { profile } = report;
  const engine = profile.engine.trim();
  const hasEngine =
    engine.length > 0 && !engine.toLowerCase().includes("unavailable");

  return {
    primary: profile.makeModel,
    secondary: hasEngine ? engine : `${profile.year} ${profile.fuel}`,
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
