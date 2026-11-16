import { beforeEach, describe, expect, vi } from "vitest";
import { ownerIt as it } from "./owner-test";

const mocks = vi.hoisted(() => ({
  saved: {} as Record<string, any>,
  updates: {} as Record<string, unknown>,
  where: null as unknown,
}));

vi.mock("../../../server/db", () => ({
  db: {
    update: () => ({
      set: (updates: Record<string, unknown>) => {
        mocks.updates = updates;
        return {
          where: (condition: unknown) => {
            mocks.where = condition;
            return {
              returning: async () => {
                mocks.saved = { ...mocks.saved, ...updates };
                return [mocks.saved];
              },
            };
          },
        };
      },
    }),
  },
}));

import { DatabaseStorage } from "../../../server/storage";
import { api } from "@shared/routes";

describe("price history corrections", () => {
  beforeEach(() => {
    mocks.saved = {
      id: 8,
      inventoryId: 4,
      listPrice: 1_500_000,
      recordedAt: new Date("2026-01-01T12:00:00Z"),
    };
    mocks.updates = {};
    mocks.where = null;
  });

  it("validates positive cent values and updates only the historical price", async () => {
    expect(api.inventory.updatePriceHistory.input.parse({ listPrice: 1_425_000 }))
      .toEqual({ listPrice: 1_425_000 });
    expect(() => api.inventory.updatePriceHistory.input.parse({ listPrice: 0 })).toThrow();
    expect(() => api.inventory.updatePriceHistory.input.parse({ listPrice: 12.5 })).toThrow();

    const originalRecordedAt = mocks.saved.recordedAt;
    const entry = await new DatabaseStorage().updateInventoryPriceHistory(4, 8, 1_425_000);

    expect(mocks.updates).toEqual({ listPrice: 1_425_000 });
    expect(mocks.where).toBeTruthy();
    expect(entry).toEqual({
      id: 8,
      inventoryId: 4,
      listPrice: 1_425_000,
      recordedAt: originalRecordedAt,
    });
  });
});
