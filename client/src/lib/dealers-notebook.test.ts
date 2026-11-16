import { describe, expect, it } from "vitest";
import {
  calculateNotebookPeriod,
  calculateNotebookInventorySnapshot,
  canCaptureNotebookInventory,
  notebookMonthEndCaptureAt,
  notebookReportSchema,
  notebookInventorySnapshotSchema,
  notebookComparisonMonthKeys,
  notebookMonthKey,
  type NotebookWatchInput,
} from "@shared/dealers-notebook";
import { prepareNotebookAnalysis } from "../../../server/dealers-notebook";

function watch(overrides: Partial<NotebookWatchInput> = {}): NotebookWatchInput {
  return {
    id: 9,
    brand: "Rolex",
    model: "Submariner",
    condition: "Excellent",
    status: "sold",
    archivedAt: null,
    purchasePrice: 70_000,
    importFee: 5_000,
    serviceFee: 2_000,
    polishFee: 0,
    platformFees: 1_000,
    shippingFee: 800,
    insuranceFee: 200,
    watchRegister: true,
    watchRegisterFeeSnapshot: null,
    salePrice: 100_000,
    soldPrice: null,
    soldDate: "2026-10-10T12:00:00Z",
    dateSold: null,
    dateListed: "2026-10-01T12:00:00Z",
    listPrice: null,
    box: true,
    papers: true,
    ...overrides,
  };
}

describe("Dealer's Notebook calculations and privacy projection", () => {
  it("assigns month boundaries using Amsterdam time", () => {
    expect(notebookMonthKey("2026-09-30T22:30:00.000Z")).toBe("2026-10");
    expect(notebookComparisonMonthKeys("2026-01", "prior-three-months")).toEqual([
      "2025-10", "2025-11", "2025-12",
    ]);
  });

  it("calculates recorded profit after watch costs and the saved register fee", () => {
    const result = calculateNotebookPeriod([watch({ watchRegisterFeeSnapshot: 900 })], [], ["2026-10"], 600, "October 2026");
    expect(result.salesCount).toBe(1);
    expect(result.revenueCents).toBe(100_000);
    expect(result.netProfitCents).toBe(20_100);
    expect(result.daysSampleCount).toBe(1);
  });

  it("captures actual stock and saved prices, including unlisted watches, without changing records", () => {
    const inventory = [
      watch({
        id: 1,
        status: "in_stock",
        soldDate: null,
        listPrice: 125_000,
      }),
      watch({
        id: 2,
        status: "sold",
        soldDate: "2026-10-31T12:00:00Z",
      }),
      watch({
        id: 3,
        status: "incoming",
        soldDate: null,
      }),
      watch({
        id: 4,
        status: "in_stock",
        archivedAt: "2026-10-15T12:00:00Z",
        soldDate: null,
      }),
      watch({
        id: 5,
        status: "sold",
        soldDate: "2026-11-02T12:00:00Z",
      }),
    ];
    const original = structuredClone(inventory);
    const snapshot = calculateNotebookInventorySnapshot(
      inventory,
      "2026-10",
      600,
      new Date("2026-10-31T22:59:59.000Z"),
    );

    expect(snapshot.activeWatchCount).toBe(2);
    expect(snapshot.listedWatchCount).toBe(1);
    expect(snapshot.watches.map((item) => item.listPriceCents)).toEqual([125_000, null]);
    expect(snapshot.listingValueCents).toBe(125_000);
    expect(snapshot.watches[0].costBasisCents).toBe(77_600);
    expect(snapshot.costBasisCents).toBe(155_200);
    expect(inventory).toEqual(original);
    expect(notebookInventorySnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("never fabricates a past or future month's holdings from today's inventory", () => {
    for (const key of ["2026-09", "2026-11", "bad"]) {
      expect(() => calculateNotebookInventorySnapshot([], key, 600, new Date("2026-10-31T12:00:00Z"))).toThrow();
    }
    expect(() => calculateNotebookInventorySnapshot([], "2026-10", 600, new Date("2026-10-30T12:00:00Z"))).toThrow();
    expect(canCaptureNotebookInventory("2026-10", new Date("2026-10-30T23:00:00Z"))).toBe(true);
    expect(canCaptureNotebookInventory("2026-10", new Date("2026-10-31T23:00:00Z"))).toBe(false);
  });

  it.each([
    ["2026-03", "2026-03-31T21:59:59.000Z"],
    ["2026-10", "2026-10-31T22:59:59.000Z"],
    ["2026-12", "2026-12-31T22:59:59.000Z"],
    ["2028-02", "2028-02-29T22:59:59.000Z"],
  ])("schedules %s using Amsterdam time including DST and leap years", (month, expected) => {
    expect(notebookMonthEndCaptureAt(month).toISOString()).toBe(expected);
  });

  it("captures zero stock and distinguishes zero asking prices from missing prices", () => {
    const now = new Date("2026-10-31T12:00:00Z");
    expect(calculateNotebookInventorySnapshot([], "2026-10", 600, now)).toMatchObject({
      activeWatchCount: 0, listedWatchCount: 0, costBasisCents: 0, listingValueCents: 0,
    });
    const snapshot = calculateNotebookInventorySnapshot([
      watch({ status: "in_stock", listPrice: 0, watchRegisterFeeSnapshot: 0 }),
      watch({ status: "servicing", listPrice: null }),
      watch({ status: "received", listPrice: 900, dateListed: "2026-11-01T12:00:00Z" }),
    ], "2026-10", 600, now);
    expect(snapshot.activeWatchCount).toBe(3);
    expect(snapshot.listedWatchCount).toBe(0);
    expect(snapshot.listingValueCents).toBe(0);
    expect(snapshot.watches.map(watch => watch.listPriceCents)).toEqual([0, null, 900]);
    expect(snapshot.watches[0].costBasisCents).toBe(77_000);
  });

  it("supplies historical totals separately from today's inventory to AI and preserves legacy reports", () => {
    const saved = calculateNotebookInventorySnapshot([
      watch({ status: "in_stock", listPrice: 100_000 }),
    ], "2026-09", 600, new Date("2026-09-30T12:00:00Z"));
    const prepared = prepareNotebookAnalysis([], [], "2026-10", "previous-month", 600, "", new Date("2026-10-31T12:00:00Z"), [saved]);
    expect(prepared.currentStock.activeListings).toBe(0);
    expect(prepared.promptData.inventorySnapshots[0].activeWatchCount).toBe(1);
    expect(prepared.promptData.inventorySnapshots[0]).not.toHaveProperty("watches");
    expect(prepared.evidence["month_end_stock_2026-09"]).toContain("1 active watches");
    const report = notebookReportSchema.parse({
      period: prepared.period, comparison: prepared.comparison, currentStock: prepared.currentStock,
      overview: "Saved legacy report", wins: [], challenges: [], improvements: [], recommendations: [],
      evidence: {}, dataCaveats: [], generatedAt: "2026-10-31T12:00:00.000Z",
    });
    expect(report.inventorySnapshots).toEqual([]);
  });

  it("keeps private inventory identifiers out of the Gemini data projection", () => {
    const privateInventoryRecord = {
      ...watch({ id: 987654, brand: "Omega" }),
      buyerName: "Fixture Buyer",
      buyerEmail: "buyer@example.invalid",
      buyerPhone: "+31 6 12345678",
      serialNumber: "FIXTURE-SERIAL",
      trackingNumber: "FIXTURE-TRACKING",
      notes: "Fixture private note",
    } as NotebookWatchInput;
    const result = prepareNotebookAnalysis(
      [privateInventoryRecord, watch({
        id: 987655,
        status: "in_stock",
        brand: "Cartier",
        model: "Tank",
        dateListed: "2026-01-01T12:00:00Z",
        listPrice: 120_000,
      })],
      [],
      "2026-10",
      "previous-month",
      600,
      "Slow sourcing month",
      new Date("2026-10-31T12:00:00Z"),
    );
    const promptData = JSON.stringify(result.promptData);
    for (const privateValue of [
      "987654",
      "987655",
      "Fixture Buyer",
      "buyer@example.invalid",
      "+31 6 12345678",
      "FIXTURE-SERIAL",
      "FIXTURE-TRACKING",
      "Fixture private note",
    ]) {
      expect(promptData).not.toContain(privateValue);
    }
    expect(promptData).toContain("Omega");
    expect(promptData).not.toContain("relatedWatches");
    expect(result.watchLinks.get("S01")?.id).toBe(987654);
  });
});
