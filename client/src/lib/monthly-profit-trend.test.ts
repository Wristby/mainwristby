import { describe, expect, it } from "vitest";
import type { InventoryReturn, InventorySale } from "@shared/schema";
import type { InventorySaleWithReturns } from "@shared/sales-lifecycle";
import {
  buildMonthlyProfitTrend,
  buildMonthlySaleCyclesCsv,
  getCurrentReportingYear,
  getSaleCycleHistoryLabel,
  getSalesForMonth,
} from "./monthly-profit-trend";

const sale = (overrides: Partial<InventorySale> = {}): InventorySaleWithReturns => ({
  id: 1,
  inventoryId: 9,
  cycleNumber: 1,
  brandSnapshot: "Rolex",
  modelSnapshot: "Submariner",
  referenceNumberSnapshot: "126610",
  serialNumberSnapshot: null,
  salePrice: 1_000_000,
  soldTo: null,
  buyerId: null,
  platformFees: 65_000,
  chrono24FeeRate: null,
  shippingFee: 0,
  insuranceFee: 0,
  soldDate: "2026-01-15T12:00:00.000Z" as unknown as Date,
  soldPlatform: "Chrono24",
  shippingPartner: null,
  trackingNumber: null,
  dateShipped: null,
  deliveredDate: null,
  purchaseDateSnapshot: null,
  dateListedSnapshot: null,
  purchasePriceSnapshot: 700_000,
  importFeeSnapshot: 0,
  serviceFeeSnapshot: 0,
  polishFeeSnapshot: 0,
  watchRegisterFeeSnapshot: 0,
  watchRegisterSnapshot: false,
  acquisitionCostCents: 700_000,
  profitAtSaleCents: 235_000,
  createdAt: new Date("2026-01-15T12:00:00.000Z"),
  updatedAt: new Date("2026-01-15T12:00:00.000Z"),
  returns: [],
  ...overrides,
});

const returnCase = (overrides: Partial<InventoryReturn> = {}): InventoryReturn => ({
  id: 10,
  saleId: 1,
  status: "completed",
  requestDate: "2026-02-01",
  reason: "Changed mind",
  returnShippedDate: null,
  receivedDate: "2026-02-10",
  carrier: null,
  trackingNumber: null,
  shippingCostCents: 5_000,
  shippingPayer: "seller",
  refundAmountCents: 100_000,
  refundDate: "2026-02-11",
  inspectionCondition: null,
  missingItems: null,
  inspectionNotes: null,
  inspectionCostCents: 0,
  nextAction: "hold",
  cogsRestoredCents: 0,
  platformFeeRefunded: false,
  completedDate: "2026-02-11",
  createdAt: new Date("2026-02-01T12:00:00.000Z"),
  updatedAt: new Date("2026-02-11T12:00:00.000Z"),
  ...overrides,
});

describe("monthly Financials profit trend", () => {
  it("returns January through December for the selected year", () => {
    const result = buildMonthlyProfitTrend([], [], 2026);

    expect(result).toHaveLength(12);
    expect(result[0]).toMatchObject({ key: "2026-01", fullMonth: "January 2026" });
    expect(result[11]).toMatchObject({ key: "2026-12", fullMonth: "December 2026" });
  });

  it("groups sales and expenses by the sale or expense month including year", () => {
    const result = buildMonthlyProfitTrend([
      sale({ id: 1, soldDate: "2025-01-15T12:00:00.000Z" as unknown as Date, profitAtSaleCents: 100_000 }),
      sale({ id: 2, soldDate: "2026-01-15T12:00:00.000Z" as unknown as Date, profitAtSaleCents: 300_000 }),
      sale({ id: 3, soldDate: "2026-11-15T12:00:00.000Z" as unknown as Date, profitAtSaleCents: 500_000 }),
    ], [
      { date: "2026-01-25T12:00:00.000Z", amount: 50_000 },
      { date: "2025-01-25T12:00:00.000Z", amount: 80_000 },
      { date: "2026-05-25T12:00:00.000Z", amount: 25_000 },
    ], 2026);

    expect(result.find(month => month.key === "2026-01")).toMatchObject({
      saleCycleProfitCents: 300_000,
      returnAdjustmentsCents: 0,
      expensesCents: 50_000,
      profitCents: 250_000,
    });
    expect(result.find(month => month.key === "2026-11")?.profitCents).toBe(500_000);
    expect(result.find(month => month.key === "2026-05")).toMatchObject({
      saleCycleProfitCents: 0,
      returnAdjustmentsCents: 0,
      expensesCents: 0,
      profitCents: 0,
    });
    expect(result.find(month => month.key === "2025-01")).toBeUndefined();
  });

  it("includes return adjustments with the sale cycle in its original sale month", () => {
    const result = buildMonthlyProfitTrend([
      sale({
        soldDate: "2026-01-15T12:00:00.000Z" as unknown as Date,
        profitAtSaleCents: 235_000,
        returns: [returnCase()],
      }),
    ], [
      { date: "2026-01-25T12:00:00.000Z", amount: 30_000 },
    ], 2026);

    const january = result.find(month => month.key === "2026-01");
    expect(january).toMatchObject({
      saleCycleProfitCents: 235_000,
      returnAdjustmentsCents: -105_000,
      expensesCents: 30_000,
      profitCents: 100_000,
    });
    expect(
      january!.saleCycleProfitCents
        + january!.returnAdjustmentsCents
        - january!.expensesCents,
    ).toBe(january!.profitCents);
    expect(result.find(month => month.key === "2026-02")).toMatchObject({
      saleCycleProfitCents: 0,
      returnAdjustmentsCents: 0,
      expensesCents: 0,
      profitCents: 0,
    });
  });

  it("keeps empty months at zero and ignores sales and expenses outside the selected year", () => {
    const result = buildMonthlyProfitTrend([
      sale({ soldDate: "2025-11-30T12:00:00.000Z" as unknown as Date, profitAtSaleCents: 900_000 }),
      sale({ id: 2, soldDate: "invalid" as unknown as Date, profitAtSaleCents: 200_000 }),
    ], [
      { date: "2026-11-30T12:00:00.000Z", amount: 12_000 },
      { date: "invalid", amount: 15_000 },
    ], 2026);

    expect(result).toHaveLength(12);
    expect(result.reduce((sum, month) => sum + month.profitCents, 0)).toBe(0);
  });

  it("uses the Amsterdam year when choosing the default", () => {
    expect(getCurrentReportingYear(new Date("2026-12-31T23:30:00.000Z"))).toBe(2027);
  });

  it("returns no monthly bars for the All Years selection", () => {
    expect(buildMonthlyProfitTrend([], [], null)).toEqual([]);
  });

  it("filters the exact sale month and year while preserving deleted-watch history", () => {
    const result = getSalesForMonth([
      sale({ id: 1, soldDate: "2026-01-31T22:30:00.000Z" as unknown as Date }),
      sale({ id: 2, soldDate: "2025-01-15T12:00:00.000Z" as unknown as Date }),
      sale({ id: 3, inventoryId: null, soldDate: "2026-01-10T12:00:00.000Z" as unknown as Date }),
    ], "2026-01");

    expect(result.map(item => item.id)).toEqual([1, 3]);
  });

  it("labels returned sale cycles separately from resales", () => {
    const returned = sale({ returns: [returnCase()] });
    const resale = sale({ cycleNumber: 2 });
    const openReturn = sale({ returns: [returnCase({ receivedDate: null })] });

    expect(getSaleCycleHistoryLabel(returned)).toBe("Returned");
    expect(getSaleCycleHistoryLabel(resale)).toBe("Resale · cycle 2");
    expect(getSaleCycleHistoryLabel(openReturn)).toBe("Return in progress");
  });

  it("exports sale-cycle snapshots, prices, adjusted profit, and labels", () => {
    const csv = buildMonthlySaleCyclesCsv([
      sale({
        soldDate: "2026-01-31T22:30:00.000Z" as unknown as Date,
        salePrice: 1_000_000,
        returns: [returnCase()],
      }),
      sale({
        id: 2,
        brandSnapshot: 'Rolex, "Vintage"',
        cycleNumber: 2,
        soldDate: "2026-01-15T12:00:00.000Z" as unknown as Date,
        salePrice: 1_200_000,
      }),
    ]);

    expect(csv).toContain(
      "Sale Date,Brand,Model,Reference Number,Sale Cycle,Sale Price (EUR),Profit After Return Adjustments (EUR),Return / Resale",
    );
    expect(csv).toContain(
      "2026-01-31,Rolex,Submariner,126610,1,10000.00,1300.00,Returned",
    );
    expect(csv).toContain(
      '2026-01-15,"Rolex, ""Vintage""",Submariner,126610,2,12000.00,2350.00,Resale · cycle 2',
    );
  });

  it("does not produce a misleading CSV for months without sale cycles", () => {
    expect(buildMonthlySaleCyclesCsv([])).toBe("");
  });
});
