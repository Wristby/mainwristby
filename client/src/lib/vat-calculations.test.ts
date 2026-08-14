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

describe("Financials page — aggregateVat matches per-watch rounding contract", () => {
  /**
   * These tests guard the Financials income summary against the rounding error
   * that arises when VAT is computed on the aggregate profit instead of per watch.
   *
   * Example: two watches each with a profit whose VAT rounds differently in
   * isolation than when their profits are summed first.
   *   Watch A profit = 100_001 cents → Math.round(100_001 × 0.21) = 21_000
   *   Watch B profit = 100_002 cents → Math.round(100_002 × 0.21) = 21_000
   *   Per-watch sum  = 42_000
   *   Wrong way (aggregate): Math.round(200_003 × 0.21) = Math.round(42_000.63) = 42_001
   */
  it("rounds VAT per watch before summing, not on the aggregate profit", () => {
    const rate = 21;
    const watchA = { salePrice: 600_001, totalCosts: 500_000, vatRate: rate }; // profit 100_001
    const watchB = { salePrice: 600_002, totalCosts: 500_000, vatRate: rate }; // profit 100_002

    const result = aggregateVat([watchA, watchB]);

    const perWatchVat =
      Math.round(100_001 * 0.21) + Math.round(100_002 * 0.21); // 21_000 + 21_000 = 42_000
    const wrongAggregateVat = Math.round(200_003 * 0.21);       // 42_001

    // Confirm the two approaches diverge (ensures the test is meaningful)
    expect(perWatchVat).not.toBe(wrongAggregateVat);

    expect(result.vatAmount).toBe(perWatchVat);
    expect(result.netAfterVat).toBe(result.profit - perWatchVat);
  });

  it("Financials net-after-VAT deducts VAT from netProfit (business expenses stay in)", () => {
    // Simulate how the Financials page computes netAfterVat:
    //   netProfit = grossProfit - businessExpenses
    //   netAfterVat = netProfit - aggregatedVatAmount
    const rate = 21;
    const watches = [
      { salePrice: 700_000, totalCosts: 500_000, vatRate: rate }, // profit €2 000 → VAT €420
      { salePrice: 550_000, totalCosts: 500_000, vatRate: rate }, // profit €500  → VAT €105
    ];
    const businessExpenses = 50_000; // €500

    const { vatAmount } = aggregateVat(watches);

    const grossProfit = 200_000 + 50_000; // €2 500
    const netProfit = grossProfit - businessExpenses; // €2 000
    const netAfterVat = netProfit - vatAmount;

    const expectedVat = Math.round(200_000 * 0.21) + Math.round(50_000 * 0.21); // 42_000 + 10_500 = 52_500
    expect(vatAmount).toBe(expectedVat);
    expect(netAfterVat).toBe(netProfit - expectedVat);
  });
});
