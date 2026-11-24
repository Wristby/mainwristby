import { describe, expect, it } from "vitest";
import type { InventoryReturn, InventorySale } from "@shared/schema";
import {
  buildReturnReconciliationCsv,
  applyCurrentDeliveryToLatestSaleCycles,
  getReturnAdjustmentCents,
  getSaleCycleNetProfitCents,
  groupReceivedReturnsByMonth,
  summarizeMonthlySalesLifecycle,
  summarizeSalesLifecycle,
  type InventorySaleWithReturns,
} from "@shared/sales-lifecycle";

const sale = (overrides: Partial<InventorySale> = {}): InventorySale => ({
  id: 1,
  inventoryId: 9,
  cycleNumber: 1,
  brandSnapshot: "Rolex",
  modelSnapshot: "Submariner",
  referenceNumberSnapshot: "126610",
  serialNumberSnapshot: "ABC",
  salePrice: 1000000,
  soldTo: "Buyer",
  buyerId: null,
  platformFees: 65000,
  chrono24FeeRate: 650,
  shippingFee: 10000,
  insuranceFee: 5000,
  soldDate: new Date("2026-01-10T00:00:00.000Z"),
  soldPlatform: "Chrono24",
  shippingPartner: "UPS",
  trackingNumber: "TRACK",
  dateShipped: null,
  deliveredDate: null,
  purchaseDateSnapshot: new Date("2025-11-10T00:00:00.000Z"),
  dateListedSnapshot: new Date("2025-11-15T00:00:00.000Z"),
  purchasePriceSnapshot: 700000,
  importFeeSnapshot: 0,
  serviceFeeSnapshot: 0,
  polishFeeSnapshot: 0,
  watchRegisterFeeSnapshot: 0,
  watchRegisterSnapshot: false,
  acquisitionCostCents: 700000,
  profitAtSaleCents: 220000,
  createdAt: new Date("2026-01-10T00:00:00.000Z"),
  updatedAt: new Date("2026-01-10T00:00:00.000Z"),
  ...overrides,
});

const returnCase = (overrides: Partial<InventoryReturn> = {}): InventoryReturn => ({
  id: 10,
  saleId: 1,
  status: "completed",
  requestDate: "2026-02-01",
  reason: "Changed mind",
  returnShippedDate: "2026-02-03",
  receivedDate: "2026-02-06",
  carrier: "UPS",
  trackingNumber: "RETURN",
  shippingCostCents: 5000,
  shippingPayer: "seller",
  refundAmountCents: 1000000,
  refundDate: "2026-02-07",
  inspectionCondition: "Good",
  missingItems: "",
  inspectionNotes: "",
  inspectionCostCents: 0,
  nextAction: "relist",
  cogsRestoredCents: 700000,
  platformFeeRefunded: true,
  completedDate: "2026-02-07",
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  updatedAt: new Date("2026-02-07T00:00:00.000Z"),
  ...overrides,
});

const saleWithReturns = (
  overrides: Partial<InventorySaleWithReturns> = {},
): InventorySaleWithReturns => ({
  ...sale(),
  returns: [],
  ...overrides,
});

describe("sales lifecycle accounting", () => {
  it("uses the current delivery date only for the watch's latest sale cycle", () => {
    const earlier = sale({ id: 1, inventoryId: 9, cycleNumber: 1, deliveredDate: "2026-01-12" });
    const latest = sale({ id: 2, inventoryId: 9, cycleNumber: 2, deliveredDate: null });
    const otherWatch = sale({ id: 3, inventoryId: 10, cycleNumber: 1, deliveredDate: null });

    const reconciled = applyCurrentDeliveryToLatestSaleCycles(
      [earlier, latest, otherWatch],
      [{ id: 9, status: "sold", deliveredDate: "2026-03-05" }],
    );

    expect(reconciled.map(item => item.deliveredDate)).toEqual([
      "2026-01-12",
      "2026-03-05",
      null,
    ]);
  });

  it("keeps the sale snapshot while separately reversing a completed full return", () => {
    const item = saleWithReturns({ returns: [returnCase()] });
    expect(item.profitAtSaleCents).toBe(220000);
    expect(getReturnAdjustmentCents(item, item.returns)).toBe(-240000);
    expect(getSaleCycleNetProfitCents(item)).toBe(-20000);
  });

  it("does not restore acquisition cost before the watch is received", () => {
    const item = returnCase({
      status: "in_transit", receivedDate: null, cogsRestoredCents: 0, platformFeeRefunded: false,
    });
    expect(getReturnAdjustmentCents(sale(), [item])).toBe(-1000000 - 5000);
  });

  it("keeps actual refunds in profit while excluding unreceived cancellations from the return rate", () => {
    const cancelled = returnCase({
      status: "cancelled",
      receivedDate: null,
      refundAmountCents: 250000,
      refundDate: "2026-02-04",
      shippingCostCents: 0,
      cogsRestoredCents: 0,
      platformFeeRefunded: false,
    });
    const item = saleWithReturns({ returns: [cancelled] });
    const summary = summarizeSalesLifecycle([item]);
    expect(getReturnAdjustmentCents(item, [cancelled])).toBe(-250000);
    expect(summary.returnedSaleCount).toBe(0);
    expect(summary.returnRatePercent).toBe(0);
  });

  it("exports canceled cases and reconciles all-time totals with Analytics", () => {
    const cancelled = returnCase({
      id: 12,
      status: "cancelled",
      receivedDate: null,
      refundAmountCents: 250000,
      refundDate: "2026-02-04",
      shippingCostCents: 1200,
      shippingPayer: "seller",
      inspectionCostCents: 800,
      cogsRestoredCents: 0,
      platformFeeRefunded: false,
    });
    const completed = returnCase({ id: 13 });
    const item = saleWithReturns({ returns: [cancelled, completed] });
    const csv = buildReturnReconciliationCsv([item]);
    const analyticsSummary = summarizeSalesLifecycle([item]);

    expect(csv).toContain("Return ID,Status,Brand,Model,Reference Number,Serial Number,Sale Cycle");
    expect(csv).toContain("12,cancelled,Rolex,Submariner,126610,ABC,1");
    expect(csv).toContain("Recorded refunds across all cases (EUR),12500.00");
    expect(csv).toContain("Seller-paid return shipping across all cases (EUR),62.00");
    expect(csv).toContain("Inspection / repair costs across all cases (EUR),8.00");
    expect(csv).toContain(`Return-adjusted net profit (EUR),${(analyticsSummary.netProfitCents / 100).toFixed(2)}`);
    expect(csv).toContain("all-time totals count each sale cycle once");
  });

  it("keeps the original purchase cost and counts it once after resale", () => {
    const firstCycle = saleWithReturns({ returns: [returnCase()] });
    const resale = saleWithReturns({
      id: 2,
      cycleNumber: 2,
      salePrice: 1200000,
      profitAtSaleCents: 420000,
      soldDate: new Date("2026-03-10T00:00:00.000Z"),
      returns: [],
    });
    const summary = summarizeSalesLifecycle([firstCycle, resale]);
    expect(summary.returnedSaleCount).toBe(1);
    expect(summary.saleCount).toBe(2);
    expect(summary.returnRatePercent).toBe(50);
    expect(summary.purchaseCostsCents).toBe(700000);
    expect(summary.netProfitCents).toBe(400000);
  });

  it("groups monthly returns by the received date", () => {
    const items = [
      saleWithReturns({ returns: [returnCase({ receivedDate: "2026-02-06" })] }),
      saleWithReturns({
        id: 2,
        returns: [returnCase({ id: 11, saleId: 2, receivedDate: "2026-02-20" })],
      }),
      saleWithReturns({
        id: 3,
        returns: [returnCase({ id: 12, saleId: 3, receivedDate: "2026-03-02" })],
      }),
    ];
    expect(groupReceivedReturnsByMonth(items)).toEqual([
      { month: "2026-02", count: 2 },
      { month: "2026-03", count: 1 },
    ]);
  });

  it("attributes return costs to receipt month and keeps resale profit in its sale month", () => {
    const original = saleWithReturns({
      soldDate: new Date("2026-01-10T12:00:00.000Z"),
      returns: [returnCase({
        receivedDate: "2026-02-06",
        refundAmountCents: 500000,
        shippingCostCents: 5000,
        inspectionCostCents: 1200,
        cogsRestoredCents: 250000,
        platformFeeRefunded: false,
      })],
    });
    const resale = saleWithReturns({
      id: 2,
      cycleNumber: 2,
      salePrice: 1200000,
      profitAtSaleCents: 420000,
      soldDate: new Date("2026-02-20T12:00:00.000Z"),
    });

    expect(summarizeMonthlySalesLifecycle([original, resale], ["2026-02"])).toEqual({
      returnCount: 1,
      refundAmountCents: 500000,
      sellerPaidShippingCents: 5000,
      inspectionCostCents: 1200,
      saleCycleCount: 1,
      resaleCount: 1,
      saleCycleProfitCents: 420000,
      returnAdjustmentCents: -256200,
      returnAdjustedProfitCents: 163800,
    });
    expect(summarizeMonthlySalesLifecycle([original, resale], ["2026-01"])).toMatchObject({
      returnCount: 0,
      saleCycleCount: 1,
      resaleCount: 0,
      saleCycleProfitCents: 220000,
      returnAdjustmentCents: 0,
    });
  });

  it("does not include buyer-paid shipping or cancelled cases in monthly return outcomes", () => {
    const item = saleWithReturns({
      returns: [
        returnCase({ shippingPayer: "buyer", shippingCostCents: 9000 }),
        returnCase({
          id: 11,
          status: "cancelled",
          receivedDate: null,
          refundAmountCents: 0,
          shippingCostCents: 0,
          cogsRestoredCents: 0,
          platformFeeRefunded: false,
        }),
      ],
    });
    expect(summarizeMonthlySalesLifecycle([item], ["2026-02"])).toMatchObject({
      returnCount: 1,
      sellerPaidShippingCents: 0,
      returnAdjustmentCents: -235000,
    });
  });
});
