import { describe, expect, it } from "vitest";
import {
  calculateNotebookPeriod,
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
