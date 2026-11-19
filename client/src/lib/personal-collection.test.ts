import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const fixture = vi.hoisted(() => ({
  lastTable: null as any,
  lastCondition: null as any,
  lastValues: null as any,
  returned: null as any,
  deleted: true,
  rows: [] as any[],
  valuationRows: [] as any[],
  valuationTable: null as any,
  conditions: [] as any[],
  writes: [] as any[],
}));

vi.mock("../../../server/db", () => {
  const makeQuery = (kind: string, table?: any) => {
    let currentTable = table;
    const query: any = {
      from(value: any) { currentTable = value; fixture.lastTable = value; return query; },
      where(value: any) { fixture.lastCondition = value; fixture.conditions.push(value); return query; },
      orderBy() { return query; },
      limit() { return query; },
      for() { return query; },
      values(value: any) { fixture.lastValues = value; fixture.writes.push({ kind, table: currentTable, values: value }); return query; },
      set(value: any) { fixture.lastValues = value; fixture.writes.push({ kind, table: currentTable, values: value }); return query; },
      returning() {
        fixture.lastTable = currentTable;
        if (kind === "delete") return Promise.resolve(fixture.deleted ? [{ id: 7 }] : []);
        return Promise.resolve([{ ...fixture.returned, ...(fixture.lastValues ?? {}) }]);
      },
      then(resolve: any, reject: any) {
        fixture.lastTable = currentTable;
        const rows = currentTable === fixture.valuationTable ? fixture.valuationRows : fixture.rows;
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return query;
  };
  const database: any = {
      select: () => makeQuery("select"),
      insert: (table: any) => makeQuery("insert", table),
      update: (table: any) => makeQuery("update", table),
      delete: (table: any) => makeQuery("delete", table),
      transaction: (callback: any) => callback(database),
  };
  return { db: database };
});

import { api } from "@shared/routes";
import { personalCollectionValuations } from "@shared/schema";
import { DatabaseStorage } from "../../../server/storage";

const dialect = new PgDialect();
const watch = {
  id: 7,
  ownerId: "owner-a",
  referenceNumber: "126610LN",
  manufacturer: "Rolex",
  model: "Submariner",
  estimatedValue: 1_000_000,
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
    fixture.valuationRows = [];
    fixture.valuationTable = personalCollectionValuations;
    fixture.conditions = [];
    fixture.writes = [];
  });

  it("validates private watch details and rejects invalid dates or money", () => {
    const input = {
      referenceNumber: " 126610LN ",
      manufacturer: " Rolex ",
      dateBought: "2024-04-12",
      purchasePrice: 1_234_500,
      estimatedValue: 1_500_000,
      gdriveLink: "https://drive.google.com/drive/folders/1vdzLtMtKb8Nwk8ii-Tlnk6FdW5sPiapx?usp=drive_link",
      intakeFees: [{ label: "Inbound shipping", amount: 2_500 }],
      technicalDetails: { caliber: "3235" },
    };
    expect(api.personalCollection.create.input.parse(input)).toMatchObject({
      referenceNumber: "126610LN",
      manufacturer: "Rolex",
      purchasePrice: 1_234_500,
      gdriveLink: "https://drive.google.com/drive/folders/1vdzLtMtKb8Nwk8ii-Tlnk6FdW5sPiapx?usp=drive_link",
      intakeFees: [{ label: "Inbound shipping", amount: 2_500 }],
    });
    expect(api.personalCollection.create.input.safeParse({ ...input, gdriveLink: "javascript:alert(1)" }).success).toBe(false);
    expect(api.personalCollection.create.input.safeParse({ ...input, dateBought: "2026-02-30" }).success).toBe(false);
    expect(api.personalCollection.create.input.safeParse({ ...input, purchasePrice: -1 }).success).toBe(false);
    expect(api.personalCollection.create.input.safeParse({ ...input, referenceNumber: " " }).success).toBe(false);
    expect(api.personalCollection.update.input.parse({ notes: "Private note" })).toEqual({ notes: "Private note" });
    expect(api.personalCollection.createValuation.input.parse({
      valuationDate: "2024-02-29",
      estimatedValue: 1_250_000,
    })).toEqual({ valuationDate: "2024-02-29", estimatedValue: 1_250_000 });
    expect(api.personalCollection.createValuation.input.safeParse({
      valuationDate: "2025-02-29",
      estimatedValue: 1_250_000,
    }).success).toBe(false);
    expect(api.personalCollection.updateValuation.input.safeParse({
      valuationDate: "2024-02-29",
      estimatedValue: -1,
    }).success).toBe(false);
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

  it("scopes valuation history to its watch owner and syncs the latest dated estimate", async () => {
    const storage = new DatabaseStorage();
    fixture.valuationRows = [{
      id: 21,
      watchId: 7,
      valuationDate: "2025-06-01",
      estimatedValue: 1_450_000,
    }];
    const history = await storage.getPersonalCollectionValuations("owner-b", 7);
    expect(history).toHaveLength(1);
    const ownerCheck = fixture.conditions.find((condition) => {
      const params = dialect.sqlToQuery(condition).params;
      return params.includes("owner-b") && params.includes(7);
    });
    expect(ownerCheck).toBeTruthy();
    fixture.rows = [];
    expect(await storage.getPersonalCollectionValuations("owner-b", 7)).toBeUndefined();
    fixture.rows = [watch];

    fixture.valuationRows = [
      { id: 22, watchId: 7, valuationDate: "2026-04-15", estimatedValue: 1_500_000 },
      { id: 21, watchId: 7, valuationDate: "2025-06-01", estimatedValue: 1_450_000 },
    ];
    fixture.writes = [];
    await storage.createPersonalCollectionValuation("owner-a", 7, {
      valuationDate: "2026-04-15",
      estimatedValue: 1_500_000,
    });
    const inserted = fixture.writes.find((write) => write.kind === "insert" && write.table === personalCollectionValuations);
    expect(inserted.values).toMatchObject({
      watchId: 7,
      valuationDate: "2026-04-15",
      estimatedValue: 1_500_000,
    });
    const syncedEstimate = fixture.writes.find((write) => write.kind === "update" && write.table !== personalCollectionValuations);
    expect(syncedEstimate.values.estimatedValue).toBe(1_500_000);

    fixture.writes = [];
    await storage.updatePersonalCollectionValuation("owner-a", 7, 21, {
      valuationDate: "2025-05-31",
      estimatedValue: 1_400_000,
    });
    const correction = fixture.writes.find((write) => write.kind === "update" && write.table === personalCollectionValuations);
    expect(correction.values).toMatchObject({
      valuationDate: "2025-05-31",
      estimatedValue: 1_400_000,
    });
    const latestAfterCorrection = fixture.writes.find((write) => write.kind === "update" && write.table !== personalCollectionValuations);
    expect(latestAfterCorrection.values.estimatedValue).toBe(1_500_000);

    fixture.writes = [];
    await storage.updatePersonalCollectionWatch("owner-a", 7, { estimatedValue: 2_000_000 });
    const profileEstimateUpdate = fixture.writes.find((write) => write.kind === "update" && write.table !== personalCollectionValuations);
    expect(profileEstimateUpdate.values.estimatedValue).toBe(1_500_000);
  });
});
