import { describe, expect, it } from "vitest";
import type { InventoryItem } from "@shared/schema";
import { buildAnalyticsCurrentSoldWatches } from "./analytics-current-sales";

function watch(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 1,
    brand: "Omega",
    model: "Seamaster",
    referenceNumber: "210.30",
    serialNumber: "SN-1",
    status: "sold",
    soldDate: new Date("2026-02-12T12:00:00.000Z"),
    dateSold: null,
    salePrice: 1_000_000,
    soldPrice: null,
    purchasePrice: 700_000,
    importFee: 10_000,
    serviceFee: 0,
    polishFee: 0,
    platformFees: 25_000,
    shippingFee: 5_000,
    insuranceFee: 0,
    watchRegister: false,
    watchRegisterFeeSnapshot: null,
    dateListed: new Date("2026-01-01T12:00:00.000Z"),
    purchaseDate: new Date("2026-01-01T12:00:00.000Z"),
    ...overrides,
  } as InventoryItem;
}

describe("Analytics current Sold metrics", () => {
  it("uses only currently Sold watches with a sale date in the selected month", () => {
    const result = buildAnalyticsCurrentSoldWatches([
      watch(),
      watch({ id: 2, status: "in_stock" }),
      watch({ id: 3, soldDate: null, dateSold: null }),
      watch({ id: 4, soldDate: new Date("2026-01-12T12:00:00.000Z") }),
    ], {
      start: null,
      end: null,
      month: 1,
      year: 2026,
      custom: true,
    }, 0);

    expect(result.map(item => item.id)).toEqual([1]);
  });

  it("calculates a current Sold watch from its inventory financial fields", () => {
    const [result] = buildAnalyticsCurrentSoldWatches([watch()], {
      start: new Date("2026-02-01T00:00:00.000Z"),
      end: new Date("2026-02-28T23:59:59.999Z"),
      custom: false,
    }, 0);

    expect(result).toMatchObject({
      id: 1,
      netRevenue: 1_000_000,
      netFees: 40_000,
      profit: 260_000,
      roi: (260_000 / 700_000) * 100,
    });
  });
});
