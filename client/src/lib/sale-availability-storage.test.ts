import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InventorySale } from "@shared/schema";

const mocks = vi.hoisted(() => ({
  saleRows: [] as any[],
  currentInventory: [] as any[],
  returnRows: [] as any[],
  selectCalls: 0,
}));

vi.mock("../../../server/db", () => ({
  db: {
    select: () => {
      const call = mocks.selectCalls++;
      return {
        from: () => ({
          where: () => call === 1
            ? Promise.resolve(mocks.currentInventory)
            : { orderBy: async () => call === 0 ? mocks.saleRows : mocks.returnRows },
        }),
      };
    },
  },
}));

import { DatabaseStorage } from "../../../server/storage";

const sale = (overrides: Partial<InventorySale> = {}): InventorySale => ({
  id: 1,
  inventoryId: 9,
  cycleNumber: 1,
  brandSnapshot: "Rolex",
  modelSnapshot: "Submariner",
  referenceNumberSnapshot: "126610",
  serialNumberSnapshot: null,
  salePrice: 1_000_000,
  soldTo: "Buyer",
  buyerId: null,
  platformFees: 65_000,
  chrono24FeeRate: null,
  shippingFee: 0,
  insuranceFee: 0,
  soldDate: new Date("2026-02-01T00:00:00.000Z"),
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
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  ...overrides,
});

describe("sale proceeds delivery-date reads", () => {
  beforeEach(() => {
    mocks.selectCalls = 0;
    mocks.saleRows = [
      sale({ id: 10, cycleNumber: 1, deliveredDate: "2026-02-10" }),
      sale({ id: 11, cycleNumber: 2, deliveredDate: null, salePrice: 1_200_000, platformFees: 70_000 }),
    ];
    mocks.currentInventory = [{ id: 9, status: "sold", deliveredDate: "2026-03-02" }];
    mocks.returnRows = [];
  });

  it("uses the current delivery date for only the latest sale cycle without changing money snapshots", async () => {
    const result = await new DatabaseStorage().getSales();

    expect(result.map(row => row.deliveredDate)).toEqual(["2026-02-10", "2026-03-02"]);
    expect(result[1]).toMatchObject({ salePrice: 1_200_000, platformFees: 70_000, returns: [] });
    expect(mocks.saleRows[1].deliveredDate).toBeNull();
    expect(mocks.saleRows[1].salePrice).toBe(1_200_000);
  });

  it("keeps historical delivery dates when the watch is no longer sold", async () => {
    mocks.currentInventory = [{ id: 9, status: "received", deliveredDate: null }];

    const result = await new DatabaseStorage().getSales();

    expect(result.map(row => row.deliveredDate)).toEqual(["2026-02-10", null]);
  });
});
