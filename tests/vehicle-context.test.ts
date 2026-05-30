import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  vehicleSnapshotForAdvisor,
  vehicleSnapshotFromLegacy,
} from "@/lib/services/advisor-routing-prompt";
import {
  applyLockedVehicleFacts,
  mergeStructuredIntake,
  resolveDvlaVehicleFacts,
} from "@/lib/services/intake-mapper";
import { createEmptyStructuredIntake } from "@/lib/types/structured-intake";
import {
  engineLabelFromCapacity,
  extractEngineDisplacement,
  formatEngineDisplacementLitres,
} from "@/lib/vehicle-engine-display";
import { vehicleIdentity } from "@/lib/vehicle-mot-display";
import type { VehicleReport } from "@/lib/types/vehicle-report";

describe("vehicle engine display", () => {
  it("formats 1398cc as 1.4L", () => {
    assert.equal(formatEngineDisplacementLitres(1398), "1.4L");
    assert.equal(engineLabelFromCapacity(1398, "Petrol"), "1.4L Petrol");
  });

  it("extracts displacement with or without space before L", () => {
    assert.equal(extractEngineDisplacement("1.4L Petrol"), "1.4L");
    assert.equal(extractEngineDisplacement("1.4 L Petrol"), "1.4L");
    assert.equal(extractEngineDisplacement("4.0L Diesel"), "4.0L");
  });

  it("vehicleIdentity keeps 1.4L in meta footer", () => {
    const report = {
      profile: {
        makeModel: "Ford Fiesta",
        year: 2019,
        fuel: "Petrol",
        engine: "1.4L Petrol",
      },
    } as VehicleReport;

    const { meta } = vehicleIdentity(report);
    assert.equal(meta, "2019 • Petrol • 1.4L");
  });
});

describe("vehicle snapshot routing", () => {
  it("legacy snapshot parses engine from meta line", () => {
    const snap = vehicleSnapshotFromLegacy({
      reg: "AB12 CDE",
      makeModel: "Ford Fiesta",
      meta: "2019 • Petrol • 1.4L",
    });
    assert.equal(snap.engine, "1.4L Petrol");
  });

  it("legacy snapshot never fabricates engine without meta displacement", () => {
    const snap = vehicleSnapshotFromLegacy({
      reg: "AB12 CDE",
      makeModel: "Ford Fiesta",
      meta: "2019 • Petrol",
    });
    assert.equal(snap.engine, "");
  });

  it("prefers DVLA report profile for advisor route", () => {
    const report = {
      reg: "AB12 CDE",
      profile: {
        makeModel: "Ford Fiesta",
        year: 2019,
        fuel: "Petrol",
        engine: "1.4L Petrol",
      },
    } as VehicleReport;

    const snap = vehicleSnapshotForAdvisor(report, {
      reg: "AB12 CDE",
      makeModel: "Ford Fiesta",
      meta: "2019 • Petrol",
    });

    assert.equal(snap.engine, "1.4L Petrol");
    assert.equal(snap.year, "2019");
  });
});

describe("DVLA vehicle fact lock", () => {
  it("blocks Gemini from overwriting locked engine", () => {
    const base = createEmptyStructuredIntake();
    const locked = { engine: "1.4L Petrol", make: "Ford", model: "Fiesta", year: "2019" };

    const merged = mergeStructuredIntake(
      base,
      { vehicle: { engine: "4L", make: "Ford", model: "Fiesta", year: "2019" } },
      locked
    );

    assert.equal(merged.vehicle.engine, "1.4L Petrol");
  });

  it("resolves locked facts from DVLA vehicle memory", () => {
    const locked = resolveDvlaVehicleFacts({
      vehicleMemory: {
        returning: false,
        recentIntakes: [],
        dvlaMatched: true,
        vehicle: {
          make: "Ford",
          model: "Fiesta",
          year: "2019",
          fuel: "Petrol",
          engine: "1.4L Petrol",
        },
      },
    });

    assert.equal(locked?.engine, "1.4L Petrol");

    const intake = applyLockedVehicleFacts(createEmptyStructuredIntake(), locked);
    assert.equal(intake.vehicle.engine, "1.4L Petrol");
  });
});
