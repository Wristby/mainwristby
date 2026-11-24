import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saved: {} as Record<string, unknown>,
  savedSale: {} as Record<string, unknown>,
  updates: [] as Array<{ target: "inventory" | "sale"; values: Record<string, unknown> }>,
}));
vi.mock("../../../server/db", () => {
  const connection: any = {
    transaction: (callback: (tx: any) => unknown) => callback(connection),
    select: () => ({
      from: () => ({
        where: () => ({
          for: async () => [mocks.saved],
          orderBy: () => ({ limit: async () => [mocks.savedSale] }),
        }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        const target = "updatedAt" in values ? "sale" : "inventory";
        mocks.updates.push({ target, values });
        return { where: () => {
          if (target === "sale") mocks.savedSale = { ...mocks.savedSale, ...values };
          else mocks.saved = { ...mocks.saved, ...values };
          const saved = target === "sale" ? mocks.savedSale : mocks.saved;
          return { returning: async () => [saved] };
        } };
      },
    }),
  };
  return { db: connection };
});
import { DatabaseStorage } from "../../../server/storage";
import { api } from "@shared/routes";

describe("delivery-only inventory updates", () => {
  beforeEach(() => {
    mocks.saved = {
      id: 1, status: "sold", salePrice: 500000, purchasePrice: 300000,
      soldDate: new Date("2026-10-01"), serviceStartDate: new Date("2026-09-01"),
      shippingPartner: "DHL", trackingNumber: "EXAMPLE", deliveredDate: null,
    };
    mocks.savedSale = {
      id: 5, inventoryId: 1, cycleNumber: 1, deliveredDate: null,
      salePrice: 500000, platformFees: 25000, profitAtSaleCents: 100000,
    };
    mocks.updates = [];
  });
  it("saves delivery to inventory and its current sale cycle without changing financial snapshots", async () => {
    const storage = new DatabaseStorage();
    const sync = vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);
    const original = { ...mocks.saved };
    const originalSale = { ...mocks.savedSale };
    await storage.updateInventoryItem(1, { deliveredDate: "2026-10-02" });
    expect(mocks.updates.slice(0, 2)).toEqual([
      { target: "inventory", values: { deliveredDate: "2026-10-02" } },
      { target: "sale", values: { deliveredDate: "2026-10-02", updatedAt: expect.any(Date) } },
    ]);
    expect(mocks.saved).toEqual({ ...original, deliveredDate: "2026-10-02" });
    expect(mocks.savedSale).toEqual({ ...originalSale, deliveredDate: "2026-10-02", updatedAt: expect.any(Date) });
    await storage.updateInventoryItem(1, { deliveredDate: "2026-10-03" });
    expect(mocks.saved.deliveredDate).toBe("2026-10-03");
    expect(mocks.savedSale.deliveredDate).toBe("2026-10-03");
    await storage.updateInventoryItem(1, { deliveredDate: null });
    expect(mocks.saved).toEqual(original);
    expect(mocks.savedSale).toMatchObject({
      ...originalSale,
      deliveredDate: null,
      updatedAt: expect.any(Date),
    });
    expect(sync).not.toHaveBeenCalled();
  });

  it("does not attach delivery edits to an old sale when the watch is no longer sold", async () => {
    const storage = new DatabaseStorage();
    mocks.saved.status = "received";
    await storage.updateInventoryItem(1, { deliveredDate: "2026-10-02" });
    expect(mocks.savedSale.deliveredDate).toBeNull();
    expect(mocks.updates).toHaveLength(1);
    expect(mocks.updates[0].target).toBe("inventory");
  });

  it("preserves the delivery date after an unrelated edit payload", async () => {
    const storage = new DatabaseStorage();
    vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);
    mocks.saved.deliveredDate = "2026-10-02";
    const updates = api.inventory.update.input.parse({ notes: "Edited watch notes" });
    await storage.updateInventoryItem(1, updates);
    expect(mocks.saved.deliveredDate).toBe("2026-10-02");
    expect(mocks.updates.every(({ values }) => !("deliveredDate" in values))).toBe(true);
  });
});
