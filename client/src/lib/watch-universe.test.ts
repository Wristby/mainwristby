import { describe, expect, it } from "vitest";
import { calculateWatchUniverse, type WatchUniverseSource } from "./watch-universe";

const baseWatch: WatchUniverseSource = {
  id: 1,
  brand: "Rolex",
  model: "Submariner",
  referenceNumber: "126610LN",
  status: "in_stock",
  archivedAt: null,
  dateListed: new Date("2026-10-20T12:00:00Z"),
  listPrice: 1_500_000,
  purchasePrice: 1_000_000,
  importFee: 50_000,
  serviceFee: 10_000,
  polishFee: 5_000,
  watchRegister: true,
  watchRegisterFeeSnapshot: 6_000,
  platformFees: 0,
  shippingFee: 0,
  insuranceFee: 0,
  chrono24FeeRate: null,
};

const settings = { chrono24CommissionPercent: 6.5, watchRegisterFeeCents: 600 };
const now = new Date("2026-10-28T12:00:00Z");

describe("Watch Universe data", () => {
  it("calculates listing age, cost basis, and margin after the configured Chrono24 fee", () => {
    const result = calculateWatchUniverse([baseWatch], settings, now);
    expect(result.activeWatchCount).toBe(1);
    expect(result.excludedWatchCount).toBe(0);
    expect(result.points[0]).toMatchObject({
      daysListed: 8,
      listPriceCents: 1_500_000,
      costBasisCents: 1_071_000,
      estimatedProfitCents: 331_500,
      estimatedMarginPercent: 22.1,
      chrono24FeePercent: 6.5,
    });
  });

  it("uses the watch-specific fee and current watch-register fallback", () => {
    const watch = {
      ...baseWatch,
      watchRegisterFeeSnapshot: null,
      chrono24FeeRate: 850,
    };
    const [point] = calculateWatchUniverse([watch], settings, now).points;
    expect(point.costBasisCents).toBe(1_065_600);
    expect(point.chrono24FeePercent).toBe(8.5);
    expect(point.estimatedProfitCents).toBe(306_900);
  });

  it("excludes sold, archived, unlisted, zero-price, and zero-cost watches", () => {
    const result = calculateWatchUniverse([
      baseWatch,
      { ...baseWatch, id: 2, status: "sold" },
      { ...baseWatch, id: 3, archivedAt: "2026-10-01T00:00:00Z" },
      { ...baseWatch, id: 4, dateListed: null },
      { ...baseWatch, id: 5, listPrice: null },
      { ...baseWatch, id: 6, purchasePrice: 0 },
      { ...baseWatch, id: 7, dateListed: "not-a-date" },
    ], settings, now);
    expect(result.activeWatchCount).toBe(5);
    expect(result.excludedWatchCount).toBe(4);
    expect(result.points.map((point) => point.id)).toEqual([1]);
  });

  it("clamps future listing dates to zero days and keeps negative margins visible", () => {
    const watch = {
      ...baseWatch,
      dateListed: new Date("2026-11-01T12:00:00Z"),
      listPrice: 100_000,
    };
    const [point] = calculateWatchUniverse([watch], settings, now).points;
    expect(point.daysListed).toBe(0);
    expect(point.estimatedMarginPercent).toBeLessThan(0);
  });
});
