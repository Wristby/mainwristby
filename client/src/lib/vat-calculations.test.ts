import { describe, it, expect } from "vitest";
import { computeVat, aggregateVat } from "./vat-calculations";

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

describe("aggregateVat — income summary aggregation", () => {
  const VAT_RATE = 21;

  it("empty inventory returns all-zero totals", () => {
    const result = aggregateVat([]);

    expect(result.profit).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netAfterVat).toBe(0);
  });

  it("mixed set: unsold and loss watches contribute zero VAT; only profitable watches add VAT", () => {
    // Watch A — profitable: profit €2 000, VAT 21 % = €420
    const watchA = { salePrice: 700_000, totalCosts: 500_000, vatRate: VAT_RATE };
    // Watch B — unsold: profit 0, VAT 0
    const watchB = { salePrice: 0, totalCosts: 300_000, vatRate: VAT_RATE };
    // Watch C — loss: bought €5 000, sold €4 000, profit −€1 000, VAT 0
    const watchC = { salePrice: 400_000, totalCosts: 500_000, vatRate: VAT_RATE };
    // Watch D — profitable: profit €500, VAT 21 % = €105
    const watchD = { salePrice: 550_000, totalCosts: 500_000, vatRate: VAT_RATE };

    const result = aggregateVat([watchA, watchB, watchC, watchD]);

    const expectedProfit =
      200_000   // A
      + 0       // B (unsold)
      + -100_000 // C (loss)
      + 50_000; // D

    const expectedVat =
      Math.round(200_000 * 0.21)  // A
      + 0                          // B
      + 0                          // C (no VAT on loss)
      + Math.round(50_000 * 0.21); // D

    const expectedNet = expectedProfit - expectedVat;

    expect(result.profit).toBe(expectedProfit);
    expect(result.vatAmount).toBe(expectedVat);
    expect(result.netAfterVat).toBe(expectedNet);
  });

  it("custom VAT rate is applied uniformly across all profitable watches", () => {
    const customRate = 9;
    const watches = [
      { salePrice: 600_000, totalCosts: 500_000, vatRate: customRate }, // profit €1 000
      { salePrice: 700_000, totalCosts: 500_000, vatRate: customRate }, // profit €2 000
    ];

    const result = aggregateVat(watches);

    const expectedVat =
      Math.round(100_000 * 0.09) +
      Math.round(200_000 * 0.09);

    expect(result.vatAmount).toBe(expectedVat);
    expect(result.netAfterVat).toBe(result.profit - expectedVat);
  });

  it("all unsold inventory returns zero VAT and zero profit", () => {
    const watches = [
      { salePrice: 0, totalCosts: 300_000, vatRate: VAT_RATE },
      { salePrice: 0, totalCosts: 500_000, vatRate: VAT_RATE },
    ];

    const result = aggregateVat(watches);

    expect(result.profit).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.netAfterVat).toBe(0);
  });
});
