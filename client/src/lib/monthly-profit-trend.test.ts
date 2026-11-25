import { describe, expect, it } from "vitest";
import {
  buildMonthlyProfitTrend,
  buildMonthlySoldWatchesCsv,
  buildMonthlyTrendSales,
  filterMonthlySoldWatches,
  getCurrentReportingYear,
  getSaleMonthKey,
  getSaleYear,
  getSalesForMonth,
  getSalesForYear,
  type MonthlyTrendInventorySource,
} from "./monthly-profit-trend";

const watch = (
  overrides: Partial<MonthlyTrendInventorySource> = {},
): MonthlyTrendInventorySource => ({
  id: 9,
  brand: "Rolex",
  model: "Submariner",
  referenceNumber: "126610",
  serialNumber: "SN-9",
  status: "sold",
  soldDate: new Date("2026-01-15T12:00:00.000Z"),
  dateSold: null,
  salePrice: 1_000_000,
  soldPrice: null,
  platformFees: 65_000,
  chrono24FeeRate: null,
  shippingFee: 5_000,
  insuranceFee: 2_000,
  purchasePrice: 700_000,
  importFee: 10_000,
  serviceFee: 8_000,
  polishFee: 5_000,
  watchRegister: false,
  watchRegisterFeeSnapshot: null,
  soldTo: "Buyer",
  ...overrides,
});

describe("monthly Financials profit trend", () => {
  it("returns all twelve months for the selected year", () => {
    const result = buildMonthlyProfitTrend([], [], 2026);

    expect(result).toHaveLength(12);
    expect(result[0]).toMatchObject({ key: "2026-01", fullMonth: "January 2026" });
    expect(result[11]).toMatchObject({ key: "2026-12", fullMonth: "December 2026" });
  });

  it("uses only inventory currently marked Sold with a recorded sale date", () => {
    const result = buildMonthlyTrendSales([
      watch(),
      watch({ id: 10, status: "in_stock", brand: "Omega" }),
      watch({ id: 11, status: "received", brand: "Cartier" }),
      watch({ id: 12, soldDate: null, dateSold: null, brand: "Tudor" }),
    ], 600);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 9,
      inventoryId: 9,
      brandSnapshot: "Rolex",
      soldDate: new Date("2026-01-15T12:00:00.000Z"),
    });
  });

  it("uses the legacy sale date when the canonical field is empty", () => {
    const result = buildMonthlyTrendSales([
      watch({ soldDate: null, dateSold: new Date("2026-03-04T12:00:00.000Z") }),
    ], 600);

    expect(result).toHaveLength(1);
    expect(getSaleMonthKey(result[0].soldDate)).toBe("2026-03");
  });

  it("calculates profit from the same current watch costs used elsewhere", () => {
    const result = buildMonthlyTrendSales([
      watch({ watchRegister: true, watchRegisterFeeSnapshot: null }),
    ], 600);

    expect(result[0].profitAtSaleCents).toBe(204_400);
  });

  it("groups only currently Sold watches by their sale month and year", () => {
    const sales = buildMonthlyTrendSales([
      watch({ id: 1, soldDate: new Date("2025-01-15T12:00:00.000Z") }),
      watch({ id: 10, soldDate: new Date("2026-01-15T12:00:00.000Z") }),
      watch({ id: 11, soldDate: new Date("2026-11-15T12:00:00.000Z") }),
    ], 600);
    const result = buildMonthlyProfitTrend(sales, [
      { date: "2026-01-25T12:00:00.000Z", amount: 5_000 },
      { date: "2026-05-25T12:00:00.000Z", amount: 25_000 },
    ], 2026);

    expect(result.find(month => month.key === "2026-01")?.profitCents).toBe(200_000);
    expect(result.find(month => month.key === "2026-11")?.profitCents).toBe(205_000);
    expect(result.find(month => month.key === "2026-05")).toMatchObject({
      saleProfitCents: 0,
      expensesCents: 0,
      profitCents: 0,
    });
  });

  it("keeps months with a zero-profit Sold watch distinct from months with no sales", () => {
    const sold = buildMonthlyTrendSales([
      watch({ salePrice: 0, soldPrice: null, platformFees: 0, shippingFee: 0, insuranceFee: 0,
        purchasePrice: 0, importFee: 0, serviceFee: 0, polishFee: 0 }),
    ], 0);
    const result = buildMonthlyProfitTrend(sold, [
      { date: "2026-01-25T12:00:00.000Z", amount: 10_000 },
    ], 2026);

    expect(result.find(month => month.key === "2026-01")).toMatchObject({
      saleProfitCents: 0,
      expensesCents: 10_000,
      profitCents: -10_000,
    });
    expect(result.find(month => month.key === "2026-02")?.profitCents).toBe(0);
  });

  it("excludes inventory outside the Sold status regardless of saved sale history", () => {
    const currentInventory = [
      watch({ status: "received" }),
      watch({ id: 10, status: "in_stock" }),
    ];
    const result = buildMonthlyTrendSales(currentInventory, 600);
    expect(result).toEqual([]);
  });

  it("filters current Sold watch rows by month, year, and search text", () => {
    const sales = buildMonthlyTrendSales([
      watch({ id: 1, soldDate: "2026-01-31T23:30:00.000Z" as unknown as Date }),
      watch({ id: 2, brand: "Omega", model: "Speedmaster", soldDate: new Date("2025-01-15T12:00:00.000Z") }),
    ], 600);

    expect(getSalesForMonth(sales, "2026-02")).toHaveLength(1);
    expect(getSalesForYear(sales, 2025).map(item => item.id)).toEqual([2]);
    expect(filterMonthlySoldWatches(sales, " speedmaster ").map(item => item.id)).toEqual([2]);
    expect(filterMonthlySoldWatches(sales, "not found")).toEqual([]);
  });

  it("filters sales by Amsterdam reporting year", () => {
    expect(getSaleYear(new Date("2025-12-31T22:30:00.000Z"))).toBe(2025);
    expect(getSaleYear(new Date("2026-12-31T23:30:00.000Z"))).toBe(2027);
  });

  it("exports only the currently Sold watch records", () => {
    const sales = buildMonthlyTrendSales([watch()], 600);
    const csv = buildMonthlySoldWatchesCsv(sales);

    expect(csv).toContain("Sale Date,Brand,Model,Reference Number,Sale Price (EUR),Profit (EUR)");
    expect(csv).toContain("2026-01-15,Rolex,Submariner,126610,10000.00,2050.00");
    expect(csv).not.toContain("Return");
    expect(buildMonthlySoldWatchesCsv([])).toBe("");
  });

  it("uses the Amsterdam calendar year for the default", () => {
    expect(getCurrentReportingYear(new Date("2026-12-31T23:30:00.000Z"))).toBe(2027);
  });

  it("does not show sales or expenses outside the selected year", () => {
    const sales = buildMonthlyTrendSales([
      watch({ soldDate: new Date("2025-11-15T12:00:00.000Z") }),
    ], 600);
    const result = buildMonthlyProfitTrend(sales, [
      { date: "2025-11-30T12:00:00.000Z", amount: 12_000 },
    ], 2026);

    expect(result).toHaveLength(12);
    expect(result.every(month => month.profitCents === 0)).toBe(true);
  });
});
