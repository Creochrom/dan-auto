import type { VehicleReport } from "@/lib/types/vehicle-report";

export type VehicleInsights = {
  motExpiryLabel: string | null;
  motDueDays: number | null;
  taxLabel: string;
  lastMotSummary: string;
  advisoryCount: number;
  advisoryItems: string[];
  discussionPoints: string[];
  upsellHints: string[];
  lastMileage: number | null;
  mileageTrend: "stable" | "rising" | "low_use" | "unknown";
};

function formatUkDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function motDueDays(report: VehicleReport): number | null {
  const expiry = report.profile.motExpiryDate;
  if (!expiry) return report.legacy.motDays > 0 ? report.legacy.motDays : null;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
  return Number.isFinite(days) ? days : null;
}

function latestAdvisories(report: VehicleReport): string[] {
  const latest = report.motHistory[0];
  if (!latest || latest.advisories.length === 0) return [];
  const items = latest.advisories.filter(
    (a) => a.toLowerCase() !== "no advisories" && !a.toLowerCase().includes("unavailable")
  );
  return items.slice(0, 8);
}

function mileageTrendFromHistory(
  history: VehicleReport["motHistory"]
): VehicleInsights["mileageTrend"] {
  const miles = history
    .map((h) => h.mileage)
    .filter((m) => m > 0)
    .slice(0, 3);
  if (miles.length < 2) return miles.length === 1 && miles[0] < 8000 ? "low_use" : "unknown";
  const [newest, older] = miles;
  const delta = newest - older;
  if (delta > 4000) return "rising";
  if (delta < 1500 && newest < 10000) return "low_use";
  return "stable";
}

function upsellFromAdvisory(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("tyre") || lower.includes("tire")) {
    return "Potential upsell: tyre inspection or replacement may be needed soon.";
  }
  if (lower.includes("brake")) {
    return "Potential upsell: brake system check recommended.";
  }
  if (lower.includes("oil") || lower.includes("leak")) {
    return "Potential upsell: fluid leak / service inspection.";
  }
  if (lower.includes("corrosion") || lower.includes("rust")) {
    return "Discuss corrosion repair scope with customer.";
  }
  if (lower.includes("suspension") || lower.includes("track rod")) {
    return "Potential upsell: steering / suspension work.";
  }
  return `Worth quoting: ${text}`;
}

/** Customer-safe lines — short, no jargon dump. */
export function getCustomerHealthLines(report: VehicleReport): string[] {
  const lines: string[] = [];
  const days = motDueDays(report);

  if (report.profile.motExpiryDate) {
    lines.push(`MOT valid until ${formatUkDate(report.profile.motExpiryDate)}`);
  } else {
    lines.push(report.profile.motStatus);
  }

  lines.push(`Tax: ${report.profile.taxStatus}`);

  const advisories = latestAdvisories(report);
  const latest = report.motHistory[0];
  if (latest) {
    const count = advisories.length;
    lines.push(
      count > 0
        ? `Last MOT: Pass with ${count} advisory item${count === 1 ? "" : "s"}`
        : `Last MOT: ${latest.result === "PASS" ? "Pass" : "Recorded"}`
    );
  }

  if (days !== null && days <= 30 && days > 0) {
    lines.push(`MOT due in ${days} day${days === 1 ? "" : "s"} — worth booking soon`);
  }

  if (report.recommendedServices[0]) {
    lines.push(`Suggested: ${report.recommendedServices[0].title}`);
  }

  return lines.slice(0, 5);
}

export function deriveVehicleInsights(report: VehicleReport): VehicleInsights {
  const days = motDueDays(report);
  const advisoryItems = latestAdvisories(report);
  const latest = report.motHistory[0];
  const lastMileage = latest?.mileage && latest.mileage > 0 ? latest.mileage : null;
  const mileageTrend = mileageTrendFromHistory(report.motHistory);

  const lastMotSummary =
    latest && advisoryItems.length > 0
      ? `${latest.result === "PASS" ? "Pass" : latest.result} · ${advisoryItems.length} advisories`
      : latest
        ? `${latest.result === "PASS" ? "Pass" : latest.result}`
        : report.profile.motStatus;

  const discussionPoints: string[] = [];
  if (days !== null && days <= 0) {
    discussionPoints.push("MOT may be expired — confirm before collection");
  } else if (days !== null && days <= 30) {
    discussionPoints.push(`MOT due in ${days} days — offer MOT booking`);
  }

  for (const item of advisoryItems.slice(0, 4)) {
    discussionPoints.push(item);
  }

  if (mileageTrend === "low_use") {
    discussionPoints.push("Low annual mileage pattern — check for short-trip use");
  } else if (mileageTrend === "rising" && lastMileage) {
    discussionPoints.push(`Last MOT mileage ${lastMileage.toLocaleString("en-GB")} mi`);
  }

  const service = report.recommendedServices[0];
  if (service) {
    discussionPoints.push(`Suggested service: ${service.title}`);
  }

  const upsellHints = advisoryItems
    .slice(0, 5)
    .map(upsellFromAdvisory)
    .filter((h): h is string => Boolean(h));

  return {
    motExpiryLabel: report.profile.motExpiryDate
      ? formatUkDate(report.profile.motExpiryDate)
      : null,
    motDueDays: days,
    taxLabel: report.profile.taxStatus,
    lastMotSummary,
    advisoryCount: advisoryItems.length,
    advisoryItems,
    discussionPoints: discussionPoints.slice(0, 6),
    upsellHints: upsellHints.slice(0, 5),
    lastMileage,
    mileageTrend,
  };
}
