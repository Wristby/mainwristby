import { describe, expect, it } from "vitest";
import {
  applyOmegaTimingPreset,
  OMEGA_TIMING_PRESETS,
} from "./omega-timing-presets";

describe("Omega timing presets", () => {
  it("provides source links and an explicit confidence note for every preset", () => {
    expect(OMEGA_TIMING_PRESETS.length).toBeGreaterThan(5);
    for (const preset of OMEGA_TIMING_PRESETS) {
      if (preset.beatRateVph != null) expect(preset.beatRateVph).toBeGreaterThan(0);
      expect(preset.confidenceLabel).not.toBe("");
      expect(preset.note).not.toBe("");
      expect(preset.sources.length).toBeGreaterThan(0);
      expect(preset.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    }
  });

  it("applies a documented lift angle and beat rate without mutating the preset", () => {
    const preset = OMEGA_TIMING_PRESETS.find((entry) => entry.id === "omega-2500d")!;
    const current = { liftAngleDegrees: 52, beatRateVph: null };

    expect(applyOmegaTimingPreset(preset, current)).toEqual({
      liftAngleDegrees: 38,
      beatRateVph: 25_200,
    });
    expect(current).toEqual({ liftAngleDegrees: 52, beatRateVph: null });
    expect(preset.liftAngleDegrees).toBe(38);
  });

  it("keeps the watch's current angle when the source does not verify one", () => {
    const preset = OMEGA_TIMING_PRESETS.find((entry) => entry.id === "omega-8800")!;

    expect(applyOmegaTimingPreset(preset, {
      liftAngleDegrees: 47,
      beatRateVph: 28_800,
    })).toEqual({
      liftAngleDegrees: 47,
      beatRateVph: 25_200,
    });
  });

  it("keeps both current settings when the source has conflicting rate data", () => {
    const preset = OMEGA_TIMING_PRESETS.find((entry) => entry.id === "omega-2500b")!;

    expect(applyOmegaTimingPreset(preset, {
      liftAngleDegrees: 47,
      beatRateVph: 25_200,
    })).toEqual({
      liftAngleDegrees: 47,
      beatRateVph: 25_200,
    });
  });

  it("allows a user override after applying a preset without changing the catalog", () => {
    const preset = OMEGA_TIMING_PRESETS.find((entry) => entry.id === "omega-2007a")!;
    const applied = applyOmegaTimingPreset(preset, { liftAngleDegrees: 52, beatRateVph: null });
    const manual = { ...applied, liftAngleDegrees: 42, beatRateVph: 28_800 };

    expect(manual).toEqual({ liftAngleDegrees: 42, beatRateVph: 28_800 });
    expect(preset.liftAngleDegrees).toBe(38);
    expect(preset.beatRateVph).toBe(25_200);
  });
});
