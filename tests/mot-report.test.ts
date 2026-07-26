import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMotHealthSummary,
  buildMotHistoryFromApi,
  buildMotServiceOpportunities,
  detectRecurringAdvisories,
  formatMotContextForAi,
} from "@/lib/mot/mot-report";
import type { MotTestRecord } from "@/lib/integrations/dvsa-mot";

const sampleTests: MotTestRecord[] = [
  {
    completedDate: "2026-01-28 00:00:00.000",
    testResult: "PASSED",
    odometerValue: 45210,
    odometerUnit: "mi",
    rfrAndComments: [
      { text: "Nearside front brake pad(s) wearing thin", type: "ADVISORY", dangerous: false },
      { text: "Offside front brake pad(s) wearing thin", type: "ADVISORY", dangerous: false },
    ],
  },
  {
    completedDate: "2025-01-15 00:00:00.000",
    testResult: "PASSED",
    odometerValue: 40100,
    odometerUnit: "mi",
    rfrAndComments: [
      { text: "Brake pad wear noted near limit", type: "ADVISORY", dangerous: false },
    ],
  },
];

describe("MOT report builders", () => {
  it("maps DVSA tests to history entries with counts", () => {
    const history = buildMotHistoryFromApi(sampleTests);
    assert.equal(history.length, 2);
    assert.equal(history[0].result, "PASS");
    assert.equal(history[0].advisoryCount, 2);
    assert.equal(history[0].mileage, 45210);
    assert.match(history[0].date, /28 Jan 2026/);
  });

  it("detects recurring brake advisories", () => {
    const history = buildMotHistoryFromApi(sampleTests);
    const themes = detectRecurringAdvisories(history);
    assert.ok(themes.includes("brake"));
  });

  it("builds MOT health summary lines", () => {
    const history = buildMotHistoryFromApi(sampleTests);
    const summary = buildMotHealthSummary(history);
    assert.ok(summary.some((line) => line.includes("2 advisory")));
    assert.ok(summary.some((line) => line.toLowerCase().includes("brake")));
  });

  it("maps brake advisories to brake inspection opportunity", () => {
    const history = buildMotHistoryFromApi(sampleTests);
    const services = buildMotServiceOpportunities(history, []);
    assert.ok(services.some((s) => s.title === "Brake inspection"));
  });

  it("formats AI MOT context with expiry and recurring themes", () => {
    const history = buildMotHistoryFromApi(sampleTests);
    const ctx = formatMotContextForAi(history, "2026-07-28");
    assert.equal(ctx.motExpiryDate, "2026-07-28");
    assert.equal((ctx.lastMot as { advisoryCount: number }).advisoryCount, 2);
    assert.ok(Array.isArray(ctx.recurringThemes));
  });
});
