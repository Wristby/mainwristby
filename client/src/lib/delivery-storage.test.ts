import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saved: {} as Record<string, unknown>,
  updates: {} as Record<string, unknown>,
}));
vi.mock("../../../server/db", () => ({
  db: {
    update: () => ({
      set: (updates: Record<string, unknown>) => {
        mocks.updates = updates;
        return { where: () => ({ returning: async () => {
          mocks.saved = { ...mocks.saved, ...updates };
          return [mocks.saved];
        } }) };
      },
    }),
  },
}));
import { DatabaseStorage } from "../../../server/storage";
import { api } from "@shared/routes";

describe("delivery-only inventory updates", () => {
  beforeEach(() => {
    mocks.saved = {
      id: 1, status: "sold", salePrice: 500000, purchasePrice: 300000,
      soldDate: new Date("2026-10-01"), serviceStartDate: new Date("2026-09-01"),
      shippingPartner: "DHL", trackingNumber: "EXAMPLE", deliveredDate: null,
    };
    mocks.updates = {};
  });
  it("saves, corrects, and clears only delivery while leaving finances and tracking alone", async () => {
    const storage = new DatabaseStorage();
    const sync = vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);
    const original = { ...mocks.saved };
    await storage.updateInventoryItem(1, { deliveredDate: "2026-10-02" });
    expect(mocks.updates).toEqual({ deliveredDate: "2026-10-02" });
    expect(mocks.saved).toEqual({ ...original, deliveredDate: "2026-10-02" });
    await storage.updateInventoryItem(1, { deliveredDate: "2026-10-03" });
    expect(mocks.saved.deliveredDate).toBe("2026-10-03");
    await storage.updateInventoryItem(1, { deliveredDate: null });
    expect(mocks.saved).toEqual(original);
    expect(sync).not.toHaveBeenCalled();
  });
  it("preserves the delivery date after an unrelated edit payload", async () => {
    const storage = new DatabaseStorage();
    vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);
    mocks.saved.deliveredDate = "2026-10-02";
    const updates = api.inventory.update.input.parse({ notes: "Edited watch notes" });
    await storage.updateInventoryItem(1, updates);
    expect(mocks.saved.deliveredDate).toBe("2026-10-02");
    expect(mocks.updates).not.toHaveProperty("deliveredDate");
  });
});
