import { describe, expect, it } from "vitest";
import {
  createInventoryTimingReadingSchema,
  inventoryTimingSettingsSchema,
} from "@shared/timing";

const validReading = {
  captureDurationSeconds: 42,
  sampleRateHz: 48_000,
  readingWindowSeconds: 20,
  requestedBeatRateVph: null,
  beatRateVph: 28_800,
  liftAngleDegrees: 52,
  rateSecondsPerDay: 4.2,
  amplitudeDegrees: 278,
  beatErrorMs: 0.3,
  beatErrorSource: "unlock",
  jitterMicroseconds: 110,
  beatsUsed: 400,
  spanSeconds: 20,
  watchHeard: true,
  findingBeat: false,
  snr: 12,
  clippedFraction: 0,
};

describe("browser timing data contract", () => {
  it("accepts the 52° default and a watch-specific beat rate", () => {
    expect(inventoryTimingSettingsSchema.parse({
      liftAngleDegrees: 52,
      beatRateVph: 28_800,
    })).toEqual({ liftAngleDegrees: 52, beatRateVph: 28_800 });
    expect(inventoryTimingSettingsSchema.parse({
      liftAngleDegrees: 52,
      beatRateVph: null,
    }).beatRateVph).toBeNull();
  });

  it("rejects lift angles and beat rates outside supported ranges", () => {
    expect(inventoryTimingSettingsSchema.safeParse({
      liftAngleDegrees: 72,
      beatRateVph: 28_800,
    }).success).toBe(false);
    expect(inventoryTimingSettingsSchema.safeParse({
      liftAngleDegrees: 52,
      beatRateVph: 2_400,
    }).success).toBe(false);
  });

  it("accepts finite computed readings but rejects invalid sample metadata", () => {
    expect(createInventoryTimingReadingSchema.parse(validReading)).toMatchObject({
      liftAngleDegrees: 52,
      rateSecondsPerDay: 4.2,
      beatRateVph: 28_800,
    });
    expect(createInventoryTimingReadingSchema.safeParse({
      ...validReading,
      sampleRateHz: Number.NaN,
    }).success).toBe(false);
    expect(createInventoryTimingReadingSchema.safeParse({
      ...validReading,
      clippedFraction: 1.2,
    }).success).toBe(false);
  });
});
