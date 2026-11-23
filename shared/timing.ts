import { z } from "zod";

const beatRateVph = z.number().int().min(3_600).max(60_000).nullable();
const finiteOrNull = z.number().finite().nullable();

export const inventoryTimingSettingsSchema = z.object({
  liftAngleDegrees: z.number().finite().min(20).max(70),
  beatRateVph,
});

export const createInventoryTimingReadingSchema = z.object({
  captureDurationSeconds: z.number().finite().min(1).max(3600),
  sampleRateHz: z.number().int().min(8_000).max(192_000),
  readingWindowSeconds: z.number().finite().min(1).max(60),
  requestedBeatRateVph: beatRateVph,
  beatRateVph,
  liftAngleDegrees: z.number().finite().min(20).max(70),
  rateSecondsPerDay: finiteOrNull,
  amplitudeDegrees: finiteOrNull,
  beatErrorMs: finiteOrNull,
  beatErrorSource: z.string().max(40).nullable(),
  jitterMicroseconds: z.number().finite().min(0).nullable(),
  beatsUsed: z.number().int().min(0).max(10_000_000),
  spanSeconds: z.number().finite().min(0).max(3600),
  watchHeard: z.boolean(),
  findingBeat: z.boolean(),
  snr: z.number().finite().min(0).nullable(),
  clippedFraction: z.number().finite().min(0).max(1).nullable(),
});

export type InventoryTimingSettings = z.infer<typeof inventoryTimingSettingsSchema>;
export type CreateInventoryTimingReading = z.infer<typeof createInventoryTimingReadingSchema>;
