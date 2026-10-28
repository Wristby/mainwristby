import { describe, expect, it } from "vitest";
import {
  calculateCogsMarginTargetPrice,
  COGS_MARGIN_TARGETS,
} from "./margin-presets";

describe("COGS margin presets", () => {
  it("provides the 10%, 15%, and 20% target margins", () => {
    expect(COGS_MARGIN_TARGETS).toEqual([10, 15, 20]);
  });

  it("calculates target prices using profit divided by sale price", () => {
    const cogsCents = 10_000;

    expect(COGS_MARGIN_TARGETS.map(target =>
      calculateCogsMarginTargetPrice(cogsCents, target)
    )).toEqual([11_112, 11_765, 12_500]);
  });

  it("includes the platform fee when calculating the required sale price", () => {
    const cogsCents = 10_000;

    expect(COGS_MARGIN_TARGETS.map(target =>
      calculateCogsMarginTargetPrice(cogsCents, target, 6.5)
    )).toEqual([11_977, 12_739, 13_606]);
  });

  it("updates the target prices when COGS changes", () => {
    expect(calculateCogsMarginTargetPrice(10_000, 20)).toBe(12_500);
    expect(calculateCogsMarginTargetPrice(20_000, 20)).toBe(25_000);
  });

  it("returns null when COGS is missing or the target is invalid", () => {
    expect(calculateCogsMarginTargetPrice(0, 10)).toBeNull();
    expect(calculateCogsMarginTargetPrice(Number.NaN, 10)).toBeNull();
    expect(calculateCogsMarginTargetPrice(10_000, 100)).toBeNull();
    expect(calculateCogsMarginTargetPrice(10_000, Number.NaN)).toBeNull();
    expect(calculateCogsMarginTargetPrice(10_000, 95, 6.5)).toBeNull();
    expect(calculateCogsMarginTargetPrice(10_000, 10, -1)).toBeNull();
  });
});
