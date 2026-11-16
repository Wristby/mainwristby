import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const fixture = vi.hoisted(() => ({
  lastTable: null as any,
  lastCondition: null as any,
  lastValues: null as any,
  returned: null as any,
  deleted: true,
  rows: [] as any[],
}));

vi.mock("../../../server/db", () => {
  const makeQuery = (kind: string, table?: any) => {
    let currentTable = table;
    const query: any = {
      from(value: any) { currentTable = value; fixture.lastTable = value; return query; },
      where(value: any) { fixture.lastCondition = value; return query; },
      orderBy() { return query; },
      values(value: any) { fixture.lastValues = value; return query; },
      set(value: any) { fixture.lastValues = value; return query; },
      returning() {
        fixture.lastTable = currentTable;
        if (kind === "delete") return Promise.resolve(fixture.deleted ? [{ id: 7 }] : []);
        return Promise.resolve([{ ...fixture.returned, ...(fixture.lastValues ?? {}) }]);
      },
      then(resolve: any, reject: any) {
        fixture.lastTable = currentTable;
        return Promise.resolve(fixture.rows).then(resolve, reject);
      },
    };
    return query;
  };
  return {
    db: {
      select: () => makeQuery("select"),
      insert: (table: any) => makeQuery("insert", table),
      update: (table: any) => makeQuery("update", table),
      delete: (table: any) => makeQuery("delete", table),
    },
  };
});

import { api } from "@shared/routes";
import { DatabaseStorage } from "../../../server/storage";

const dialect = new PgDialect();
const watch = {
  id: 7,
  ownerId: "owner-a",
  referenceNumber: "126610LN",
  manufacturer: "Rolex",
  model: "Submariner",
  condition: "Pre-owned",
  conditionGrade: "Excellent",
  intakeFees: [],
  technicalDetails: {},
};

function whereParams() {
  return dialect.sqlToQuery(fixture.lastCondition).params;
}

describe("personal collection", () => {
  beforeEach(() => {
    fixture.lastTable = null;
    fixture.lastCondition = null;
    fixture.lastValues = null;
    fixture.returned = watch;
    fixture.deleted = true;
    fixture.rows = [watch];
  });

  it("validates private watch details and rejects invalid dates or money", () => {
    const input = {
      referenceNumber: " 126610LN ",
      manufacturer: " Rolex ",
      dateBought: "2024-04-12",
      purchasePrice: 1_234_500,
      estimatedValue: 1_500_000,
      intakeFees: [{ label: "Inbound shipping", amount: 2_500 }],
      technicalDetails: { caliber: "3235" },
    };
    expect(api.personalCollection.create.input.parse(input)).toMatchObject({
      referenceNumber: "126610LN",
      manufacturer: "Rolex",
      purchasePrice: 1_234_500,
      intakeFees: [{ label: "Inbound shipping", amount: 2_500 }],
    });
    expect(api.personalCollection.create.input.safeParse({ ...input, dateBought: "2026-02-30" }).success).toBe(false);
    expect(api.personalCollection.create.input.safeParse({ ...input, purchasePrice: -1 }).success).toBe(false);
    expect(api.personalCollection.create.input.safeParse({ ...input, referenceNumber: " " }).success).toBe(false);
    expect(api.personalCollection.update.input.parse({ notes: "Private note" })).toEqual({ notes: "Private note" });
  });

  it("scopes list and detail reads to the signed-in owner", async () => {
    const storage = new DatabaseStorage();
    await storage.getPersonalCollectionWatches("owner-a");
    expect(fixture.lastTable).toBeTruthy();
    expect(whereParams()).toContain("owner-a");

    await storage.getPersonalCollectionWatch("owner-b", 7);
    expect(whereParams()).toContain("owner-b");
    expect(whereParams()).toContain(7);
  });

  it("keeps create, update, and delete inside the owning collection", async () => {
    const storage = new DatabaseStorage();
    const { id: _id, ownerId: _ownerId, ...input } = watch;

    const created = await storage.createPersonalCollectionWatch("owner-a", input as any);
    expect(fixture.lastValues).toMatchObject({ ownerId: "owner-a", manufacturer: "Rolex" });
    expect(created.ownerId).toBe("owner-a");

    await storage.updatePersonalCollectionWatch("owner-b", 7, { notes: "Personal note" });
    expect(fixture.lastValues).toMatchObject({ notes: "Personal note" });
    expect(fixture.lastValues.updatedAt).toBeInstanceOf(Date);
    expect(whereParams()).toContain("owner-b");
    expect(whereParams()).toContain(7);

    expect(await storage.deletePersonalCollectionWatch("owner-a", 7)).toBe(true);
    expect(whereParams()).toContain("owner-a");
    expect(whereParams()).toContain(7);

    fixture.deleted = false;
    expect(await storage.deletePersonalCollectionWatch("owner-b", 7)).toBe(false);
    expect(whereParams()).toContain("owner-b");
  });
});
