import { describe, it, expect } from "vitest";
import { computeVat } from "./vat-calculations";

// All monetary values in euro cents; vatRate in percentage points.
const VAT_RATE = 21; // default from use-settings.ts

describe("computeVat — VAT KPI card calculations", () => {
  it("unsold watch (salePrice = 0) shows €0 VAT and €0 profit", () => {
    const result = computeVat({
      salePrice: 0,
      totalCosts: 500_000, // €5 000 purchase cost
      vatRate: VAT_RATE,
    });

    expect(result.profit).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netAfterVat).toBe(0);
  });

  it("watch sold below cost (loss) shows €0 VAT and negative netAfterVat equal to profit", () => {
    // Bought for €5 000, sold for €4 000 → loss of €1 000
    const salePrice = 400_000;
    const totalCosts = 500_000;

    const result = computeVat({ salePrice, totalCosts, vatRate: VAT_RATE });

    expect(result.profit).toBe(-100_000);
    expect(result.vatAmount).toBe(0); // no VAT on a loss
    expect(result.netAfterVat).toBe(-100_000); // equals profit when vatAmount = 0
  });

  it("profitable watch shows correct VAT amount and net after VAT", () => {
    // Bought for €5 000, sold for €7 000 → profit €2 000, VAT 21 % = €420
    const salePrice = 700_000;
    const totalCosts = 500_000;

    const result = computeVat({ salePrice, totalCosts, vatRate: VAT_RATE });

    expect(result.profit).toBe(200_000);
    expect(result.vatAmount).toBe(Math.round(200_000 * 0.21)); // 42 000 cents = €420
    expect(result.netAfterVat).toBe(200_000 - Math.round(200_000 * 0.21)); // 158 000 = €1 580
  });

  it("watch sold exactly at cost shows €0 VAT (break-even)", () => {
    const price = 500_000;

    const result = computeVat({ salePrice: price, totalCosts: price, vatRate: VAT_RATE });

    expect(result.profit).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netAfterVat).toBe(0);
  });

  it("respects a custom vatRate setting", () => {
    // Same numbers but with a 10 % VAT rate
    const result = computeVat({
      salePrice: 700_000,
      totalCosts: 500_000,
      vatRate: 10,
    });

    expect(result.vatAmount).toBe(Math.round(200_000 * 0.1)); // 20 000 cents = €200
    expect(result.netAfterVat).toBe(200_000 - Math.round(200_000 * 0.1));
  });
});
