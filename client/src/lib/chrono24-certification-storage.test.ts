import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T14:00:00.000Z"));
    mocks.saved = {
      id: 17,
      status: "in_stock",
      chrono24CertificationSent: false,
      chrono24CertificationSentAt: null,
      listPrice: null,
    };
    mocks.updates = {};
  });

  afterEach(() => vi.useRealTimers());

  it("saves the checkbox by itself and returns it when the watch is reopened", async () => {
    const storage = new DatabaseStorage();
    vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);

    await storage.updateInventoryItem(17, { chrono24CertificationSent: true });

    expect(mocks.updates).toEqual({
      chrono24CertificationSent: true,
      chrono24CertificationSentAt: new Date("2026-11-16T14:00:00.000Z"),
    });
    expect((await storage.getInventoryItem(17))?.chrono24CertificationSent).toBe(true);
    expect((await storage.getInventoryItem(17))?.chrono24CertificationSentAt)
      .toEqual(new Date("2026-11-16T14:00:00.000Z"));

    await storage.updateInventoryItem(17, { chrono24CertificationSent: false });
    expect((await storage.getInventoryItem(17))?.chrono24CertificationSent).toBe(false);
    expect((await storage.getInventoryItem(17))?.chrono24CertificationSentAt).toBeNull();
  });

  it("does not assign a date when an older already-checked watch is saved", async () => {
    mocks.saved.chrono24CertificationSent = true;
    mocks.saved.chrono24CertificationSentAt = null;
    const storage = new DatabaseStorage();
    vi.spyOn(storage as any, "syncWatchFeesToExpenses").mockResolvedValue(undefined);

    await storage.updateInventoryItem(17, { chrono24CertificationSent: true });

    expect(mocks.saved.chrono24CertificationSentAt).toBeNull();
  });
});
