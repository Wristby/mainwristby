import { describe, expect, it } from "vitest";
import {
  getInventoryReportingDate,
  getPositiveSaleAmount,
  getSaleAmount,
  isSoldInCalendarPeriod,
  matchesCalendarPeriod,
  summarizeWatchSales,
} from "@shared/reporting";

describe("shared reporting definitions", () => {
  it("prefers the modern sale amount, falls back to legacy data, and preserves recorded zero", () => {
    expect(getSaleAmount({ salePrice: 0, soldPrice: 125_000 })).toBe(125_000);
    expect(getSaleAmount({ salePrice: 200_000, soldPrice: 125_000 })).toBe(200_000);
    expect(getSaleAmount({ salePrice: 0, soldPrice: 0 })).toBe(0);
    expect(getSaleAmount({ salePrice: null, soldPrice: null })).toBeNull();
    expect(getPositiveSaleAmount({ salePrice: 0, soldPrice: 0 })).toBeNull();
    expect(getPositiveSaleAmount({ salePrice: null, soldPrice: 125_000 })).toBe(125_000);
  });

  it("uses the sale date for sold inventory and purchase date otherwise", () => {
    expect(getInventoryReportingDate({
      status: "sold",
      soldDate: "2026-02-01T12:00:00Z",
      dateSold: "2026-01-01T12:00:00Z",
      purchaseDate: "2025-12-01T12:00:00Z",
    })?.toISOString()).toBe("2026-02-01T12:00:00.000Z");
    expect(getInventoryReportingDate({
      status: "in_stock",
      soldDate: "2026-02-01T12:00:00Z",
      dateSold: null,
      purchaseDate: "2025-12-01T12:00:00Z",
    })?.toISOString()).toBe("2025-12-01T12:00:00.000Z");
  });

  it("matches selected calendar periods and excludes undated sales only when filtered", () => {
    const january = new Date(2026, 0, 14);
    expect(matchesCalendarPeriod(january, { month: 0, year: 2026 })).toBe(true);
    expect(matchesCalendarPeriod(january, { month: 1, year: 2026 })).toBe(false);
    expect(matchesCalendarPeriod(null, {})).toBe(true);
    expect(matchesCalendarPeriod(null, { year: 2026 })).toBe(false);

    const undatedSale = { status: "sold", soldDate: null, dateSold: null } as const;
    expect(isSoldInCalendarPeriod(undatedSale, {})).toBe(true);
    expect(isSoldInCalendarPeriod(undatedSale, { year: 2026 })).toBe(false);
    expect(isSoldInCalendarPeriod({ ...undatedSale, status: "in_stock" }, {})).toBe(false);
  });

  it("summarizes sales with shared costs and distinguishes missing amounts from zero", () => {
    const summary = summarizeWatchSales([
      { salePrice: 0, soldPrice: 1_500, purchasePrice: 1_000, importFee: 100 },
      { salePrice: 0, soldPrice: 0, purchasePrice: 400 },
      { salePrice: null, soldPrice: null, purchasePrice: 200 },
    ]);

    expect(summary).toMatchObject({
      salesCount: 3,
      pricedSalesCount: 2,
      unpricedSalesCount: 1,
      revenueCents: 1_500,
      purchaseCostsCents: 1_600,
      watchCostsCents: 100,
      totalCostsCents: 1_700,
      netProfitCents: -200,
    });
  });

  it("preserves a saved zero register fee instead of applying today's default", () => {
    const summary = summarizeWatchSales([
      {
        salePrice: 10_000,
        soldPrice: null,
        purchasePrice: 5_000,
        watchRegister: true,
        watchRegisterFeeSnapshot: 0,
      },
      {
        salePrice: 10_000,
        soldPrice: null,
        purchasePrice: 5_000,
        watchRegister: true,
        watchRegisterFeeSnapshot: null,
      },
    ], 600);

    expect(summary.watchCostsCents).toBe(600);
    expect(summary.totalCostsCents).toBe(10_600);
  });
});
