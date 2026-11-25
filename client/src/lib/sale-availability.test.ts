import { describe, expect, it } from "vitest";
import type { InventoryReturn, InventorySale } from "@shared/schema";
import { calculateSaleAvailability } from "@shared/sale-availability";
import {
  applyCurrentDeliveryToLatestSaleCycles,
  type InventorySaleWithReturns,
} from "@shared/sales-lifecycle";

const sale = (overrides: Partial<InventorySale> = {}): InventorySaleWithReturns => ({
  id: 1,
  inventoryId: 9,
  cycleNumber: 1,
  brandSnapshot: "Rolex",
  modelSnapshot: "Submariner",
  referenceNumberSnapshot: "126610",
  serialNumberSnapshot: "ABC",
  salePrice: 1_000_000,
  soldTo: "Buyer",
  buyerId: null,
  platformFees: 65_000,
  chrono24FeeRate: 650,
  shippingFee: 10_000,
  insuranceFee: 5_000,
  soldDate: "2026-03-01T00:00:00.000Z",
  soldPlatform: "Chrono24",
  shippingPartner: "UPS",
  trackingNumber: "TRACK",
  dateShipped: null,
  deliveredDate: null,
  purchaseDateSnapshot: new Date("2025-11-10T00:00:00.000Z"),
  dateListedSnapshot: new Date("2025-11-15T00:00:00.000Z"),
  purchasePriceSnapshot: 700_000,
  importFeeSnapshot: 0,
  serviceFeeSnapshot: 0,
  polishFeeSnapshot: 0,
  watchRegisterFeeSnapshot: 0,
  watchRegisterSnapshot: false,
  acquisitionCostCents: 700_000,
  profitAtSaleCents: 220_000,
  createdAt: new Date("2026-03-01T00:00:00.000Z"),
  updatedAt: new Date("2026-03-01T00:00:00.000Z"),
  returns: [],
  ...overrides,
});

const returnCase = (status: InventoryReturn["status"]): InventoryReturn => ({
  id: 4,
  saleId: 1,
  status,
  requestDate: "2026-03-05",
  reason: "",
  returnShippedDate: null,
  receivedDate: null,
  carrier: null,
  trackingNumber: null,
  shippingCostCents: 0,
  shippingPayer: "seller",
  refundAmountCents: 0,
  refundDate: null,
  inspectionCondition: null,
  missingItems: null,
  inspectionNotes: null,
  inspectionCostCents: 0,
  nextAction: "hold",
  cogsRestoredCents: 0,
  platformFeeRefunded: false,
  completedDate: null,
  createdAt: new Date("2026-03-05T00:00:00.000Z"),
  updatedAt: new Date("2026-03-05T00:00:00.000Z"),
});

describe("sale availability", () => {
  const now = new Date("2026-03-10T12:00:00.000Z");

  it("counts proceeds after platform fees while awaiting delivery", () => {
    const result = calculateSaleAvailability([sale()], now);
    expect(result.awaitingDeliveryCents).toBe(935_000);
    expect(result.awaitingDelivery).toHaveLength(1);
    expect(result.inReturnWindowCents).toBe(0);
    expect(result.availableCents).toBe(0);
    expect(result.totalTrackedCents).toBe(935_000);
    expect(result.totalTrackedSaleCount).toBe(1);
  });

  it("includes sold watches without tracking numbers before and after delivery", () => {
    const awaiting = calculateSaleAvailability([
      sale({ trackingNumber: null }),
    ], now);
    const delivered = calculateSaleAvailability([
      sale({ trackingNumber: null, deliveredDate: "2026-03-02" }),
    ], now);

    expect(awaiting.awaitingDeliveryCents).toBe(935_000);
    expect(delivered.inReturnWindowCents).toBe(935_000);
    expect(delivered.inReturnWindow).toHaveLength(1);
  });

  it("shows a release countdown after delivery and releases the day after the deadline", () => {
    const delivered = sale({ deliveredDate: "2026-03-02" });
    const result = calculateSaleAvailability([delivered], now);
    expect(result.inReturnWindow[0]).toMatchObject({
      state: "in_return_window",
      daysUntilAvailable: 7,
      releaseDate: "2026-03-17",
      proceedsCents: 935_000,
    });

    const afterWindow = calculateSaleAvailability([delivered], new Date("2026-03-18T12:00:00.000Z"));
    expect(afterWindow.availableCents).toBe(935_000);
    expect(afterWindow.available[0].state).toBe("available");
    expect(afterWindow.totalTrackedCents).toBe(935_000);
  });

  it("places an already-delivered sold watch in the return window using its current inventory date", () => {
    const legacySale = sale({ deliveredDate: null });
    const reconciled = applyCurrentDeliveryToLatestSaleCycles(
      [legacySale],
      [{ id: 9, status: "sold", deliveredDate: "2026-03-02" }],
    );
    const result = calculateSaleAvailability(reconciled, now);

    expect(result.awaitingDelivery).toHaveLength(0);
    expect(result.inReturnWindow).toHaveLength(1);
    expect(result.inReturnWindowCents).toBe(935_000);
  });

  it("adds only the three active proceeds stages to the pipeline total", () => {
    const result = calculateSaleAvailability([
      sale({ id: 1, deliveredDate: null }),
      sale({ id: 2, deliveredDate: "2026-03-02" }),
      sale({ id: 3, deliveredDate: "2026-02-22" }),
      sale({ id: 4, returns: [returnCase("requested")] }),
    ], now);

    expect(result.awaitingDeliveryCents).toBe(935_000);
    expect(result.inReturnWindowCents).toBe(935_000);
    expect(result.availableCents).toBe(935_000);
    expect(result.totalTrackedCents).toBe(2_805_000);
    expect(result.totalTrackedSaleCount).toBe(3);
  });

  it("keeps cleared proceeds only through delivery day 17", () => {
    const delivered = sale({ deliveredDate: "2026-03-02" });

    const day15 = calculateSaleAvailability([delivered], new Date("2026-03-17T12:00:00.000Z"));
    expect(day15.availableCents).toBe(935_000);

    const day17 = calculateSaleAvailability([delivered], new Date("2026-03-19T12:00:00.000Z"));
    expect(day17.availableCents).toBe(935_000);

    const day18 = calculateSaleAvailability([delivered], new Date("2026-03-20T12:00:00.000Z"));
    expect(day18.available).toHaveLength(0);
    expect(day18.availableCents).toBe(0);
  });

  it("counts each resale cycle separately", () => {
    const firstCycle = sale({ id: 10, cycleNumber: 1, deliveredDate: "2026-03-02" });
    const secondCycle = sale({ id: 11, cycleNumber: 2, deliveredDate: "2026-03-03" });
    const result = calculateSaleAvailability([firstCycle, secondCycle], now);
    expect(result.inReturnWindow).toHaveLength(2);
    expect(result.inReturnWindowCents).toBe(1_870_000);
  });

  it("excludes active and completed returns but restores declined or cancelled sales", () => {
    const active = sale({ returns: [returnCase("requested")] });
    const completed = sale({ id: 2, returns: [returnCase("completed")] });
    const declined = sale({ id: 3, returns: [returnCase("declined")] });
    const cancelled = sale({ id: 4, returns: [returnCase("cancelled")] });
    const result = calculateSaleAvailability([active, completed, declined, cancelled], now);
    expect(result.returnExcludedCount).toBe(2);
    expect(result.awaitingDelivery).toHaveLength(2);
    expect(result.awaitingDeliveryCents).toBe(1_870_000);
    expect(result.totalTrackedCents).toBe(1_870_000);
    expect(result.totalTrackedSaleCount).toBe(2);
  });

  it("flags unpriced and invalid delivery records for review instead of treating them as available", () => {
    const unpriced = sale({ salePrice: 0 });
    const invalidDelivery = sale({ id: 2, deliveredDate: "not-a-date" });
    const result = calculateSaleAvailability([unpriced, invalidDelivery], now);
    expect(result.needsReview).toHaveLength(2);
    expect(result.awaitingDeliveryCents).toBe(0);
    expect(result.availableCents).toBe(0);
  });
});
