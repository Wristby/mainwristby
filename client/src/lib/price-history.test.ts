import { describe, expect, it } from "vitest";
import { getListedPriceChange, shouldRecordListedPrice } from "@shared/price-history";

describe("listed price history", () => {
  it("records a first price and later changes, but not unchanged or cleared values", () => {
    expect(shouldRecordListedPrice(null, 1_250_000)).toBe(true);
    expect(shouldRecordListedPrice(1_250_000, 1_200_000)).toBe(true);
    expect(shouldRecordListedPrice(1_250_000, 1_250_000)).toBe(false);
    expect(shouldRecordListedPrice(1_250_000, null)).toBe(false);
    expect(shouldRecordListedPrice(null, 0)).toBe(false);
  });

  it("calculates price increases and reductions against the previous entry", () => {
    expect(getListedPriceChange(1_250_000, 1_200_000)).toEqual({
      direction: "down",
      amount: 50_000,
      percent: 4,
    });
    expect(getListedPriceChange(1_200_000, 1_250_000)).toEqual({
      direction: "up",
      amount: 50_000,
      percent: 50_000 / 1_200_000 * 100,
    });
    expect(getListedPriceChange(1_200_000, 1_200_000)).toBeNull();
  });
});
