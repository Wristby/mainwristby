import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saved: {} as Record<string, any>,
  updates: {} as Record<string, unknown>,
}));

vi.mock("../../../server/db", async () => {
  const schema = await import("@shared/schema");
  const connection: any = {
    transaction: (callback: (tx: any) => unknown) => callback(connection),
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          const rows = table === schema.inventory ? [mocks.saved] : [];
          const query: any = Promise.resolve(rows);
          query.for = async () => rows;
          return query;
        },
      }),
    }),
    update: () => ({
      set: (updates: Record<string, unknown>) => {
        mocks.updates = updates;
        return {
          where: () => ({
            returning: async () => {
              mocks.saved = { ...mocks.saved, ...updates };
              return [mocks.saved];
            },
          }),
        };
      },
    }),
  };
  return { db: connection };
});

import { DatabaseStorage } from "../../../server/storage";

describe("Chrono24 Certification persistence", () => {
  beforeEach(() => {
    mocks.saved = {
      id: 17,
      status: "in_stock",
      chrono24CertificationSent: false,
      listPrice: null,
    };
    mocks.updates = {};
  });

  it("saves the checkbox by itself and returns it when the watch is reopened", async () => {
    const storage = new DatabaseStorage();
    vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);

    await storage.updateInventoryItem(17, { chrono24CertificationSent: true });

    expect(mocks.updates).toEqual({ chrono24CertificationSent: true });
    expect((await storage.getInventoryItem(17))?.chrono24CertificationSent).toBe(true);

    await storage.updateInventoryItem(17, { chrono24CertificationSent: false });
    expect((await storage.getInventoryItem(17))?.chrono24CertificationSent).toBe(false);
  });
});
