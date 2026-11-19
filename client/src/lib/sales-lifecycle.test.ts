import { describe, expect, it } from "vitest";
import type { InventoryReturn, InventorySale } from "@shared/schema";
import {
  getReturnAdjustmentCents,
  getSaleCycleNetProfitCents,
  groupReceivedReturnsByMonth,
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
});
