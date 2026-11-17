import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Client, Expense, InventoryItem } from "@shared/schema";

vi.mock("../../../server/db", () => ({ db: { select: vi.fn() } }));

import { DatabaseStorage } from "../../../server/storage";
import { db } from "../../../server/db";

const seller = { id: 7, name: "Test Dealer" } as Client;
const inventoryRows = [
  { id: 1, clientId: 7, brand: "Rolex" },
  { id: 2, clientId: null, brand: "Cartier" },
];
const joinedRows = inventoryRows.map((item, index) => ({
  item: item as unknown as InventoryItem,
  seller: index === 0 ? seller : null,
}));

function mockInventoryQuery(rows = joinedRows) {
  const builder = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  vi.mocked(db.select).mockReturnValue(builder as never);
  return builder;
}

describe("inventory storage seller joins", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads active inventory and sellers in one joined query", async () => {
    const builder = mockInventoryQuery();
    const storage = new DatabaseStorage();

    const result = await storage.getInventoryItems();

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(builder.leftJoin).toHaveBeenCalledTimes(1);
    expect(builder.where).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({ id: 1, seller });
    expect(result[1]).toMatchObject({ id: 2 });
    expect(result[1].seller).toBeUndefined();
  });

  it("applies status filtering and still includes archived items when requested", async () => {
    const builder = mockInventoryQuery();
    const storage = new DatabaseStorage();

    await storage.getInventoryItems("sold", true);

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(builder.where).toHaveBeenCalledTimes(1);
    expect(builder.orderBy).toHaveBeenCalledTimes(1);
  });

  it("loads archived inventory and sellers in one joined query", async () => {
    const builder = mockInventoryQuery();
    const storage = new DatabaseStorage();

    const result = await storage.getArchivedInventoryItems();

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(builder.leftJoin).toHaveBeenCalledTimes(1);
    expect(builder.where).toHaveBeenCalledTimes(1);
    expect(builder.orderBy).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({ id: 1, seller });
  });

  it("loads expenses with their linked watch in one joined query", async () => {
    const expense = { id: 10, inventoryId: 1, description: "Service" } as Expense;
    const builder = mockInventoryQuery([
      { expense, inventory: joinedRows[0].item },
      { expense: { ...expense, id: 11, inventoryId: null }, inventory: null },
    ]);
    const storage = new DatabaseStorage();

    const result = await storage.getExpenses();

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(builder.leftJoin).toHaveBeenCalledTimes(1);
    expect(builder.orderBy).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({ id: 10, inventory: { id: 1, brand: "Rolex" } });
    expect(result[1].inventory).toBeUndefined();
  });

  it("keeps dashboard totals while selecting only fields used by its calculations", async () => {
    const settingsBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ value: 600 }]),
    };
    const inventoryBuilder = {
      from: vi.fn().mockResolvedValue([
        {
          status: "in_stock",
          archivedAt: null,
          purchaseDate: new Date("2026-01-01T00:00:00Z"),
          purchasePrice: 40_000,
          watchRegister: true,
          watchRegisterFeeSnapshot: 500,
        },
        {
          status: "sold",
          archivedAt: null,
          purchaseDate: new Date("2026-01-01T00:00:00Z"),
          soldDate: new Date("2026-01-10T00:00:00Z"),
          dateSold: null,
          purchasePrice: 100_000,
          importFee: 10_000,
          serviceFee: 2_000,
          polishFee: 0,
          watchRegister: false,
          watchRegisterFeeSnapshot: null,
          platformFees: 5_000,
          shippingFee: 3_000,
          insuranceFee: 1_000,
          salePrice: 200_000,
        },
      ]),
    };
    const selectMock = db.select as unknown as {
      mockReturnValueOnce: (result: unknown) => { mockReturnValueOnce: (result: unknown) => unknown };
      mock: { calls: unknown[][] };
    };
    selectMock.mockReturnValueOnce(settingsBuilder).mockReturnValueOnce(inventoryBuilder);
    const storage = new DatabaseStorage();

    const stats = await storage.getDashboardStats();

    expect(stats).toEqual({
      totalInventoryValue: 40_500,
      totalProfit: 79_000,
      activeInventoryCount: 1,
      soldInventoryCount: 1,
      turnRate: 9,
    });
    const selectedFields = selectMock.mock.calls[1][0] as Record<string, unknown>;
    expect(Object.keys(selectedFields)).toEqual([
      "status",
      "archivedAt",
      "purchaseDate",
      "soldDate",
      "dateSold",
      "purchasePrice",
      "importFee",
      "serviceFee",
      "polishFee",
      "watchRegister",
      "watchRegisterFeeSnapshot",
      "platformFees",
      "shippingFee",
      "insuranceFee",
      "salePrice",
      "soldPrice",
    ]);
  });
});
