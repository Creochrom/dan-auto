import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDvsaMotJson, fetchMotHistoryFromDvsa } from "@/lib/integrations/dvsa-mot";

const legacyArrayPayload = [
  {
    registration: "ZZ99ABC",
    make: "FORD",
    model: "FOCUS",
    motTests: [
      {
        completedDate: "2013.11.03 09:33:08",
        testResult: "PASSED",
        expiryDate: "2014.11.02",
        odometerValue: "47125",
        odometerUnit: "mi",
        rfrAndComments: [],
      },
      {
        completedDate: "2013.11.01 11:28:34",
        testResult: "FAILED",
        odometerValue: "47118",
        odometerUnit: "mi",
        rfrAndComments: [
          {
            text: "Front brake disc excessively pitted (3.5.1h)",
            type: "FAIL",
            dangerous: true,
          },
          {
            text: "Nearside Rear wheel bearing has slight play (2.6.2)",
            type: "ADVISORY",
            dangerous: false,
          },
        ],
      },
    ],
  },
];

const newApiObjectPayload = {
  registration: "MV57HJX",
  make: "BMW",
  model: "3 SERIES",
  motTests: [
    {
      completedDate: "2025-04-26T10:07:11.000Z",
      testResult: "PASSED",
      odometerValue: "184660",
      odometerUnit: "MI",
      expiryDate: "2026-04-25",
      defects: [
        {
          text: "Nearside Rear Tyre worn close to legal limit",
          type: "ADVISORY",
          dangerous: false,
        },
      ],
    },
  ],
};

describe("DVSA MOT response parsing", () => {
  it("parses legacy array API responses", () => {
    const vehicle = parseDvsaMotJson(legacyArrayPayload);
    assert.ok(vehicle);
    assert.equal(vehicle.registration, "ZZ99ABC");
    assert.equal(vehicle.motTests?.length, 2);
    assert.equal(vehicle.motTests?.[0].testResult, "PASSED");
    assert.equal(vehicle.motTests?.[0].odometerValue, 47125);
    assert.equal(vehicle.motTests?.[1].rfrAndComments?.length, 2);
  });

  it("parses new API object responses with defects array", () => {
    const vehicle = parseDvsaMotJson(newApiObjectPayload);
    assert.ok(vehicle);
    assert.equal(vehicle.registration, "MV57HJX");
    assert.equal(vehicle.motTests?.[0].odometerUnit, "mi");
    assert.equal(vehicle.motTests?.[0].odometerValue, 184660);
    assert.equal(
      vehicle.motTests?.[0].rfrAndComments?.[0].text,
      "Nearside Rear Tyre worn close to legal limit"
    );
    assert.equal(vehicle.motTests?.[0].rfrAndComments?.[0].type, "ADVISORY");
  });

  it("sorts tests newest first", () => {
    const vehicle = parseDvsaMotJson(legacyArrayPayload);
    assert.ok(vehicle?.motTests?.[0].completedDate.includes("2013.11.03"));
  });
});

/**
 * Live integration — runs only when MOT_HISTORY_API_KEY is set.
 */
describe("DVSA MOT live integration", { skip: !process.env.MOT_HISTORY_API_KEY?.trim() }, () => {
  it("fetches MOT history for a registration", async () => {
    const reg = process.env.MOT_TEST_REG?.trim() || "OW08HPA";
    const result = await fetchMotHistoryFromDvsa(reg);
    assert.ok(result, `expected MOT data for ${reg}`);
    assert.ok(Array.isArray(result.motTests));
  });
});
