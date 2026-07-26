import type { MotTestRecord } from "@/lib/integrations/dvsa-mot";
import type { MotHistoryEntry, RecommendedService } from "@/lib/types/vehicle-report";

function formatMotDate(raw: string): string {
  try {
    const d = new Date(raw.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function toMiles(value: number | null | undefined, unit: "mi" | "km" | null | undefined): number {
  if (!value) return 0;
  if (unit === "km") return Math.round(value * 0.621371);
  return value;
}

function splitComments(test: MotTestRecord): { advisories: string[]; failures: string[] } {
  const advisories: string[] = [];
  const failures: string[] = [];

  for (const c of test.rfrAndComments ?? []) {
    if (c.type === "ADVISORY") {
      advisories.push(c.text);
    } else if (["MAJOR", "MINOR", "DANGEROUS", "PRS"].includes(c.type)) {
      failures.push(c.text);
    }
  }

  return { advisories, failures };
}

/** Convert DVSA tests (newest first) to frontend MOT history entries. */
export function buildMotHistoryFromApi(tests: MotTestRecord[]): MotHistoryEntry[] {
  return tests.map((t) => {
    const { advisories, failures } = splitComments(t);
    return {
      date: formatMotDate(t.completedDate),
      result: t.testResult === "PASSED" ? "PASS" : "FAIL",
      mileage: toMiles(t.odometerValue, t.odometerUnit),
      advisories,
      failures,
      advisoryCount: advisories.length,
      defectCount: failures.length,
    };
  });
}

function normalizeKeyword(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Detect recurring advisory themes across multiple MOT tests. */
export function detectRecurringAdvisories(history: MotHistoryEntry[]): string[] {
  const counts = new Map<string, number>();

  for (const entry of history) {
    const seenInTest = new Set<string>();
    for (const item of [...entry.advisories, ...entry.failures]) {
      const key = normalizeKeyword(item);
      if (!key || key.length < 4) continue;
      const themes = ["brake", "tyre", "tire", "suspension", "corrosion", "rust", "oil", "exhaust"];
      const theme = themes.find((t) => key.includes(t));
      if (!theme || seenInTest.has(theme)) continue;
      seenInTest.add(theme);
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([theme]) => theme);
}

const RECURRING_LABELS: Record<string, string> = {
  brake: "Repeated brake wear advisories detected across multiple tests.",
  tyre: "Repeated tyre advisories detected across multiple tests.",
  tire: "Repeated tyre advisories detected across multiple tests.",
  suspension: "Repeated suspension advisories detected across multiple tests.",
  corrosion: "Recurring corrosion advisories noted on MOT history.",
  rust: "Recurring corrosion advisories noted on MOT history.",
  oil: "Recurring oil leak advisories noted on MOT history.",
  exhaust: "Recurring exhaust advisories noted on MOT history.",
};

/** Customer-facing MOT health summary lines. */
export function buildMotHealthSummary(history: MotHistoryEntry[]): string[] {
  if (history.length === 0) {
    return ["MOT test history is not available from DVSA for this vehicle."];
  }

  const lines: string[] = [];
  const latest = history[0];
  const advisoryCount = latest.advisoryCount;
  const defectCount = latest.defectCount;

  if (latest.result === "FAIL") {
    lines.push(
      defectCount > 0
        ? `Vehicle failed last MOT with ${defectCount} defect${defectCount === 1 ? "" : "s"}.`
        : "Vehicle failed last MOT."
    );
  } else if (advisoryCount > 0) {
    lines.push(
      `Vehicle passed last MOT with ${advisoryCount} advisory item${advisoryCount === 1 ? "" : "s"}.`
    );
  } else {
    lines.push("Vehicle passed last MOT with no advisories.");
  }

  const recurring = detectRecurringAdvisories(history);
  if (recurring.length > 0) {
    for (const theme of recurring.slice(0, 2)) {
      const label = RECURRING_LABELS[theme];
      if (label) lines.push(label);
    }
  } else if (history.length >= 2) {
    lines.push("No recurring defects detected.");
  }

  const miles = history.map((h) => h.mileage).filter((m) => m > 0);
  if (miles.length >= 2) {
    const delta = miles[0] - miles[1];
    if (delta > 8000) {
      lines.push("Mileage progression appears higher than typical between MOTs.");
    } else if (delta >= 1500) {
      lines.push("Mileage progression appears normal.");
    } else if (miles[0] < 8000) {
      lines.push("Low annual mileage pattern between MOTs.");
    }
  }

  return lines.slice(0, 4);
}

const MOT_SERVICE_MAP: { keywords: string[]; service: Omit<RecommendedService, "id"> }[] = [
  {
    keywords: ["brake", "pad", "disc"],
    service: {
      title: "Brake inspection",
      description: "Pads, discs and fluid — address MOT brake advisories early.",
      priceFrom: 39,
      priceLabel: "from £39",
    },
  },
  {
    keywords: ["tyre", "tire", "tread"],
    service: {
      title: "Tyre check",
      description: "Tread depth, sidewall condition and pressure — MOT advisory follow-up.",
      priceFrom: 25,
      priceLabel: "from £25",
    },
  },
  {
    keywords: ["suspension", "track rod", "shock", "spring"],
    service: {
      title: "Suspension inspection",
      description: "Bushings, dampers and alignment — suspension MOT items.",
      priceFrom: 49,
      priceLabel: "from £49",
    },
  },
  {
    keywords: ["exhaust", "emission", "catalyst", "dpf"],
    service: {
      title: "Exhaust & emissions check",
      description: "Exhaust leaks and emissions readiness ahead of MOT.",
      priceFrom: 45,
      priceLabel: "from £45",
    },
  },
  {
    keywords: ["oil", "leak", "fluid"],
    service: {
      title: "Fluid leak inspection",
      description: "Identify and quote oil or fluid leaks flagged on MOT.",
      priceFrom: 35,
      priceLabel: "from £35",
    },
  },
];

/** Build workshop revenue opportunities from MOT advisories and failures. */
export function buildMotServiceOpportunities(
  history: MotHistoryEntry[],
  fallback: RecommendedService[]
): RecommendedService[] {
  const text = history
    .slice(0, 3)
    .flatMap((h) => [...h.advisories, ...h.failures])
    .join(" ")
    .toLowerCase();

  if (!text.trim()) return fallback;

  const matched: RecommendedService[] = [];
  const usedTitles = new Set<string>();

  for (const rule of MOT_SERVICE_MAP) {
    if (rule.keywords.some((k) => text.includes(k)) && !usedTitles.has(rule.service.title)) {
      matched.push({
        id: `mot-svc-${matched.length}`,
        ...rule.service,
      });
      usedTitles.add(rule.service.title);
    }
  }

  if (matched.length === 0) return fallback;

  const extras = fallback.filter((s) => !usedTitles.has(s.title)).slice(0, 2);
  return [...matched, ...extras].slice(0, 4);
}

/** Compact MOT context for AI advisor prompts. */
export function formatMotContextForAi(history: MotHistoryEntry[], motExpiryDate?: string | null): Record<string, unknown> {
  const latest = history[0];
  const recurring = detectRecurringAdvisories(history);

  return {
    motExpiryDate: motExpiryDate ?? undefined,
    lastMot: latest
      ? {
          date: latest.date,
          result: latest.result,
          mileage: latest.mileage || undefined,
          advisoryCount: latest.advisoryCount,
          defectCount: latest.defectCount,
          advisories: latest.advisories.slice(0, 5),
          failures: latest.failures.slice(0, 5),
        }
      : undefined,
    previousMotDate: history[1]?.date,
    recurringThemes: recurring,
    healthSummary: buildMotHealthSummary(history),
    recentTests: history.slice(0, 4).map((h) => ({
      date: h.date,
      result: h.result,
      mileage: h.mileage || undefined,
      advisories: h.advisoryCount,
      defects: h.defectCount,
    })),
  };
}
