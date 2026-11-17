import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const fixture = vi.hoisted(() => ({
  db: { transaction: vi.fn() }, fail: "", operations: [] as string[],
  auth: vi.fn(),
}));
vi.mock("../../../server/db", () => ({ db: fixture.db }));
vi.mock("../../../server/auth", () => ({ isAuthenticated: fixture.auth }));
import { registerClientBackfillRoutes, resolveHistoricalBuyer, syncHistoricalBuyers } from "../../../server/client-backfill";
import { buyerReviewPath, buyerSyncPath } from "@shared/client-backfill";

// Isolated transaction adapter. Never connects to a database or reads business records.
let state: Record<string, any[]>;
const dialect = new PgDialect();
function connection(snapshot: typeof state) {
  function query(kind: string, initialTable?: any) {
    let table = initialTable, condition: any, values: any;
    const execute = () => {
      const name = getTableName(table), rows = snapshot[name];
      fixture.operations.push(`${kind}:${name}`);
      const matches = (row: any) => {
        if (!condition) return true;
        const { sql, params } = dialect.sqlToQuery(condition);
        const column = sql.match(/"[^"]+"\."([^"]+)"/)?.[1];
        const field = Object.entries(getTableColumns(table)).find(([, value]: any) => value.name === column)?.[0];
        if (!field) throw new Error("Unsupported fixture condition");
        return sql.includes("is null") ? row[field] == null : row[field] === params[0];
      };
      if (kind === "select") return rows.filter(matches).map(row => ({ ...row }));
      if (fixture.fail === `${kind}:${name}`) throw new Error("Fixture failure");
      if (kind === "insert") {
        const row = { id: Math.max(0, ...rows.map(row => row.id)) + 1, email: null, phone: null, country: null, ...values };
        rows.push(row); return [{ ...row }];
      }
      return rows.filter(matches).map(row => { Object.assign(row, values); return { ...row }; });
    };
    const builder: any = {
      from(value: any) { table = value; return builder; },
      where(value: any) { condition = value; return builder; },
      orderBy() { return builder; },
      for() { fixture.operations.push("lock:watch"); return builder; },
      set(value: any) { values = value; return builder; },
      values(value: any) { values = value; return builder; },
      returning() { return Promise.resolve().then(execute); },
      then(resolve: any, reject: any) { return Promise.resolve().then(execute).then(resolve, reject); },
    };
    return builder;
  }
  return {
    select: () => query("select"), insert: (table: any) => query("insert", table),
    update: (table: any) => query("update", table),
    execute: async () => { fixture.operations.push("lock:contacts"); },
  };
}
beforeEach(() => {
  fixture.fail = ""; fixture.operations = [];
  state = {
    clients: [{ id: 4, name: "Existing Person", email: "saved@example.invalid", phone: "+31 1234", country: "Netherlands", profileClearedAt: null }],
    inventory: [
      { id: 1, brand: "Cartier", model: "Tank", referenceNumber: "TEST", soldTo: "  Unique Buyer  ", buyerId: null, clientId: 4, salePrice: 10000, notes: "Keep", status: "sold" },
      { id: 2, soldTo: "EXISTING PERSON", buyerId: null, clientId: 4 },
      { id: 3, soldTo: "Repeated Buyer", buyerId: null },
      { id: 5, soldTo: "Repeated Buyer", buyerId: null },
    ],
    expenses: [{ id: 99, inventoryId: 1, amount: 500 }],
  };
  fixture.db.transaction.mockReset().mockImplementation(async callback => {
    const snapshot = structuredClone(state);
    const result = await callback(connection(snapshot));
    state = snapshot;
    return result;
  });
});

describe("transactional historical buyer backfill", () => {
  it("backfills unique names, links history, and preserves all existing data", async () => {
    const oldClient = structuredClone(state.clients[0]), oldWatch = structuredClone(state.inventory[0]);
    const report = await syncHistoricalBuyers();
    expect(report.created).toBe(1);
    expect(report.pending.map(row => row.watch.id)).toEqual([2, 3, 5]);
    expect(state.clients).toHaveLength(2);
    expect(state.clients[1]).toMatchObject({ name: "Unique Buyer", email: null, phone: null });
    expect(state.clients[0]).toEqual(oldClient);
    expect(state.inventory[0]).toEqual({ ...oldWatch, buyerId: state.clients[1].id });
    expect(state.expenses).toEqual([{ id: 99, inventoryId: 1, amount: 500 }]);
    expect(fixture.operations.indexOf("lock:watch")).toBeLessThan(fixture.operations.indexOf("lock:contacts"));
  });
  it("is idempotent after refresh or a repeated request", async () => {
    await syncHistoricalBuyers();
    const before = structuredClone(state);
    expect((await syncHistoricalBuyers()).created).toBe(0);
    expect(state).toEqual(before);
  });
  it("only links possible name matches after an explicit choice, without copying or overwriting contacts", async () => {
    const before = structuredClone(state.clients);
    await resolveHistoricalBuyer({ action: "link", watchId: 2, expectedName: "EXISTING PERSON", clientId: 4 });
    expect(state.clients).toEqual(before);
    expect(state.inventory[1]).toMatchObject({ buyerId: 4, soldTo: "EXISTING PERSON", clientId: 4 });
  });
  it("allows explicitly creating a different person with the same name", async () => {
    await resolveHistoricalBuyer({ action: "create", watchId: 2, expectedName: "EXISTING PERSON" });
    expect(state.clients).toHaveLength(2);
    expect(state.inventory[1].buyerId).not.toBe(4);
  });
  it("leaves repeated unlinked names for review rather than combining people", async () => {
    await resolveHistoricalBuyer({ action: "create", watchId: 3, expectedName: "Repeated Buyer" });
    const report = await syncHistoricalBuyers();
    expect(report.pending.find(row => row.watch.id === 5)?.matches).toHaveLength(1);
    expect(state.inventory.find(row => row.id === 5).buyerId).toBeNull();
  });
  it.each(["insert:clients", "update:inventory"])("rolls back client and watch writes if %s fails", async failure => {
    const before = structuredClone(state); fixture.fail = failure;
    await expect(syncHistoricalBuyers()).rejects.toThrow("Fixture failure");
    expect(state).toEqual(before);
  });
  it("rejects stale snapshots and repeated review submissions", async () => {
    await expect(resolveHistoricalBuyer({ action: "create", watchId: 2, expectedName: "Old Name" })).rejects.toMatchObject({ status: 409 });
    await resolveHistoricalBuyer({ action: "create", watchId: 2, expectedName: "EXISTING PERSON" });
    const before = structuredClone(state);
    await expect(resolveHistoricalBuyer({ action: "create", watchId: 2, expectedName: "EXISTING PERSON" })).rejects.toMatchObject({ status: 409 });
    expect(state).toEqual(before);
  });
  it("rejects missing clients and watches without partial writes", async () => {
    const before = structuredClone(state);
    await expect(resolveHistoricalBuyer({ action: "link", watchId: 2, expectedName: "EXISTING PERSON", clientId: 404 })).rejects.toMatchObject({ status: 409 });
    await expect(resolveHistoricalBuyer({ action: "create", watchId: 404, expectedName: "Missing" })).rejects.toMatchObject({ status: 404 });
    expect(state).toEqual(before);
  });
  it("does not restore contact details previously cleared by retention", async () => {
    state.clients[0] = { ...state.clients[0], email: null, phone: null, country: null, profileClearedAt: new Date() };
    const before = structuredClone(state.clients);
    await syncHistoricalBuyers();
    await resolveHistoricalBuyer({ action: "link", watchId: 2, expectedName: "EXISTING PERSON", clientId: 4 });
    expect(state.clients.slice(0, 1)).toEqual(before);
  });
  it("protects both write routes with authentication", () => {
    const post = vi.fn();
    registerClientBackfillRoutes({ post } as any);
    expect(post.mock.calls.map(([path, auth]) => [path, auth])).toEqual([
      [buyerSyncPath, fixture.auth], [buyerReviewPath, fixture.auth],
    ]);
  });
});
