import { describe, expect, it } from "vitest";
import {
  calculateWatchCostBreakdown,
  calculateWatchFinancials,
  calculateSaleFinancials,
  calculateSaleFeeCents,
  calculateTargetSalePriceCents,
} from "@shared/watch-financials";
import { computeVat } from "./vat-calculations";
import { calculateCogsMarginTargetPrice } from "./margin-presets";
import { buildSalesPatternData } from "./sales-patterns";
import { calculateWatchUniverse } from "./watch-universe";
import { calculateNotebookPeriod } from "@shared/dealers-notebook";

const watch = {
  purchasePrice: 500_000,
  importFee: 10_000,
  serviceFee: 15_000,
  polishFee: 5_000,
  platformFees: 45_500,
  shippingFee: 2_000,
  insuranceFee: 1_000,
  watchRegister: true,
  watchRegisterFeeSnapshot: 600,
};

describe("shared watch financial engine", () => {
  it("includes every watch cost once and keeps acquisition and selling costs separate", () => {
    const result = calculateWatchCostBreakdown(watch, 900);
    expect(result.acquisitionCostsCents).toBe(530_600);
    expect(result.sellingCostsCents).toBe(48_500);
    expect(result.otherWatchCostsCents).toBe(79_100);
    expect(result.totalCostsCents).toBe(579_100);
  });

  it("uses sale price for margin, and purchase price for existing purchase-price ROI", () => {
    const result = calculateWatchFinancials(watch, 700_000, 21, 900);
    expect(result.profitCents).toBe(120_900);
    expect(result.marginPercent).toBeCloseTo(120_900 / 700_000 * 100);
    expect(result.roiPercent).toBeCloseTo(120_900 / 500_000 * 100);
    expect(result.vatAmountCents).toBe(25_389);
    expect(result.netAfterVatCents).toBe(95_511);
  });

  it("preserves a zero register snapshot and ignores register charges when not selected", () => {
    expect(calculateWatchCostBreakdown({ ...watch, watchRegisterFeeSnapshot: 0 }, 900).watchRegisterFeeCents).toBe(0);
    expect(calculateWatchCostBreakdown({ ...watch, watchRegister: false }, 900).watchRegisterFeeCents).toBe(0);
    expect(calculateWatchCostBreakdown({ ...watch, watchRegisterFeeSnapshot: null }, 900).watchRegisterFeeCents).toBe(900);
  });

  it("handles absent optional costs without changing the saved watch", () => {
    const source = Object.freeze({ purchasePrice: 100_000, importFee: null });
    expect(calculateWatchCostBreakdown(source).totalCostsCents).toBe(100_000);
  });

  it("does not estimate VAT on losses or break-even sales", () => {
    for (const salePriceCents of [400_000, 579_100]) {
      const result = calculateWatchFinancials(watch, salePriceCents, 21);
      expect(result.vatAmountCents).toBe(0);
      expect(result.netAfterVatCents).toBe(result.profitCents);
    }
  });

  it("keeps empty estimates distinct from explicitly recorded zero sales", () => {
    expect(calculateSaleFinancials({ salePriceCents: 0, totalCostsCents: 50_000 }).profitCents).toBe(0);
    expect(calculateSaleFinancials({ salePriceCents: 0, totalCostsCents: 50_000, recordedSale: true }).profitCents).toBe(-50_000);
  });

  it("preserves fractional VAT rates and rounds the tax per watch in cents", () => {
    const result = calculateSaleFinancials({ salePriceCents: 10_003, totalCostsCents: 5_000, vatRatePercent: 9.5 });
    expect(result.vatAmountCents).toBe(Math.round(5_003 * 0.095));
  });

  it("keeps the existing VAT and margin preset public helpers consistent with the engine", () => {
    const direct = calculateWatchFinancials(watch, 700_000, 21);
    expect(computeVat({ salePrice: 700_000, totalCosts: direct.totalCostsCents, vatRate: 21 })).toEqual({
      profit: direct.profitCents, vatAmount: direct.vatAmountCents, netAfterVat: direct.netAfterVatCents,
    });
    expect(calculateCogsMarginTargetPrice(500_000, 15, 6.5)).toBe(calculateTargetSalePriceCents(500_000, 15, 6.5));
  });

  it("handles zero cost basis without dividing by zero", () => {
    const result = calculateWatchFinancials({}, 10_000);
    expect(result.marginPercent).toBe(100);
    expect(result.roiPercent).toBe(0);
  });

  it("rounds platform commissions once to whole cents", () => {
    expect(calculateSaleFeeCents(100_001, 6.5)).toBe(6_500);
  });

  it("gives Sales Patterns, the Notebook, and Watch Universe the same cost basis and profit", () => {
    const sold = {
      ...watch, id: 1, brand: "Cartier", model: "Santos", referenceNumber: "WSSA",
      condition: "excellent", status: "sold", archivedAt: null,
      salePrice: 700_000, soldPrice: null,
      soldDate: "2026-10-15", dateSold: null, dateListed: "2026-10-01",
      listPrice: 700_000, box: true, papers: true, chrono24FeeRate: 0,
    };
    const expected = calculateWatchFinancials(sold, 700_000, 0, 900);
    const patterns = buildSalesPatternData([sold], 900, 2026);
    const notebook = calculateNotebookPeriod([sold], [], ["2026-10"], 900, "October 2026");
    // Set estimated commission to zero here to isolate the shared saved costs.
    const universe = calculateWatchUniverse([{ ...sold, status: "in_stock" }], {
      watchRegisterFeeCents: 900, chrono24CommissionPercent: 0,
    }, new Date("2026-10-16"));
    expect(patterns.rows[0].cells[9].records[0].profitCents).toBe(expected.profitCents);
    expect(notebook.netProfitCents).toBe(expected.profitCents);
    expect(universe.points[0].estimatedProfitCents).toBe(expected.profitCents);
    expect(universe.points[0].costBasisCents).toBe(expected.totalCostsCents);
    expect(notebook.marginPercent).toBeCloseTo(expected.marginPercent);
  });
});
