import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const fixture = vi.hoisted(() => ({
  db: { transaction: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
  failure: "", operations: [] as string[],
}));
vi.mock("../../../server/db", () => ({ db: fixture.db }));
import { DatabaseStorage } from "../../../server/storage";

// An isolated transaction adapter: no database connection, account, or business data.
type State = Record<string, any[]>;
let state: State;
const dialect = new PgDialect();
const storage = new DatabaseStorage();
function connection(getState: () => State) {
  const query = (kind: string, initialTable?: any) => {
    let table = initialTable, condition: any, values: any;
    const execute = () => {
      const name = getTableName(table);
      fixture.operations.push(`${kind}:${name}`);
      const rows = getState()[name];
      const matches = (row: any) => {
        if (!condition) return true;
        const { sql, params } = dialect.sqlToQuery(condition);
        const columnName = sql.match(/"[^"]+"\."([^"]+)"\s*=\s*\$1/)?.[1];
        const field = Object.entries(getTableColumns(table)).find(([, col]: any) => col.name === columnName)?.[0];
        const equal = field ? row[field] === params[0] : true;
        return equal && (!sql.includes("LIKE") || row.description.startsWith(String(params[1]).replace(/%$/, "")));
      };
      if (kind === "select") return rows.filter(matches).map(row => ({ ...row }));
      if ((fixture.failure === "watch" && name === "inventory" && (kind === "update" || kind === "insert"))
        || (fixture.failure === "client" && name === "clients" && kind === "insert")
        || (fixture.failure === "expenses" && name === "expenses" && kind === "insert")
        || (fixture.failure === "delete" && kind === "delete")) throw new Error("Fixture failure");
      if (kind === "insert") {
        const row = { id: Math.max(0, ...rows.map(row => row.id)) + 1, ...values };
        rows.push(row); return [{ ...row }];
      }
      if (kind === "update") {
        return rows.filter(matches).map(row => { Object.assign(row, values); return { ...row }; });
      }
      getState()[name] = rows.filter(row => !matches(row));
      return [];
    };
    const builder: any = {
      from(value: any) { table = value; return builder; },
      where(value: any) { condition = value; return builder; },
      for() { fixture.operations.push("lock:watch"); return builder; },
      set(value: any) { values = value; return builder; },
      values(value: any) { values = value; return builder; },
      returning() { return Promise.resolve().then(execute); },
      then(resolve: any, reject: any) { return Promise.resolve().then(execute).then(resolve, reject); },
    };
    return builder;
  };
  return {
    select: vi.fn(() => query("select")),
    insert: vi.fn(table => query("insert", table)),
    update: vi.fn(table => query("update", table)),
    delete: vi.fn(table => query("delete", table)),
    execute: vi.fn(async () => { fixture.operations.push("lock:contacts"); }),
  };
}

beforeEach(() => {
  fixture.failure = ""; fixture.operations = [];
  state = {
    clients: [{ id: 91, name: "Existing dealer", type: "dealer", email: "saved@example.invalid", phone: "+31 (6) 1234", country: "Netherlands", notes: "Preserve notes", isVip: true }],
    inventory: [{ id: 11, brand: "Rolex", model: "Fixture", referenceNumber: "TEST", status: "sold",
      purchasePrice: 100000, salePrice: 120000, clientId: 91, buyerId: null, soldTo: "Historical name", watchRegisterFeeSnapshot: 600 }],
    expenses: [], settings: [],
  };
  Object.assign(fixture.db, connection(() => state));
  fixture.db.transaction.mockReset().mockImplementation(async callback => {
    const snapshot = structuredClone(state);
    const result = await callback(connection(() => snapshot));
    state = snapshot;
    return result;
  });
});

describe("atomic watch buyer persistence", () => {
  const newWatch = () => ({
    brand: "Rolex", model: "Intake fixture", referenceNumber: "INTAKE", status: "sold" as const,
    condition: "Good" as const, purchasePrice: 100000, targetSellPrice: 150000,
    clientId: 91, serviceFee: 500, soldTo: "Untrusted name",
  });
  it.each([
    {}, { email: "new@example.invalid" }, { phone: "+31 6 9999" },
    { country: "Netherlands" }, { email: "new@example.invalid", phone: "+31 6 9999", country: "Netherlands" },
  ])("creates a watch and buyer atomically with optional contacts: %s", async contact => {
    const result = await storage.createInventoryItem(newWatch(), { mode: "new", name: "Intake buyer", ...contact });
    expect(state.clients).toHaveLength(2);
    expect(result).toMatchObject({ clientId: 91, buyerId: state.clients[1].id, soldTo: "Intake buyer", watchRegisterFeeSnapshot: 600 });
    expect(state.clients[1]).toMatchObject({ name: "Intake buyer", type: "client",
      email: contact.email || null, phone: contact.phone || null, country: contact.country || null });
    expect(state.expenses).toContainEqual(expect.objectContaining({ inventoryId: result.id, amount: 500 }));
    expect(fixture.operations).toContain("lock:contacts");
  });
  it("links a saved buyer on creation without changing seller or Client data", async () => {
    const before = structuredClone(state.clients);
    const result = await storage.createInventoryItem(newWatch(), { mode: "existing", clientId: 91 });
    expect(result).toMatchObject({ clientId: 91, buyerId: 91, soldTo: "Existing dealer" });
    expect(state.clients).toEqual(before);
  });
  it.each([{ email: "SAVED@example.invalid" }, { phone: "+31-6-1234" }])("rejects duplicate intake contacts atomically: %s", async contact => {
    const before = structuredClone(state);
    await expect(storage.createInventoryItem(newWatch(), { mode: "new", name: "Duplicate", ...contact })).rejects.toMatchObject({ status: 409 });
    expect(state).toEqual(before);
  });
  it("allows different intake buyers to share a name", async () => {
    await storage.createInventoryItem(newWatch(), { mode: "new", name: "Existing dealer" });
    expect(state.clients).toHaveLength(2);
  });
  it.each(["client", "watch", "expenses"])("rolls back all intake writes if %s creation fails", async failure => {
    const before = structuredClone(state); fixture.failure = failure;
    await expect(storage.createInventoryItem(newWatch(), { mode: "new", name: "Rollback intake" })).rejects.toThrow("Fixture failure");
    expect(state).toEqual(before);
  });
  it("rejects a deleted intake buyer without creating records", async () => {
    const before = structuredClone(state);
    await expect(storage.createInventoryItem(newWatch(), { mode: "existing", clientId: 404 })).rejects.toMatchObject({ status: 400 });
    expect(state).toEqual(before);
  });
  it("supports blank buyers and legacy creation without adding Clients", async () => {
    const blank = await storage.createInventoryItem(newWatch(), { mode: "none" });
    expect(blank).toMatchObject({ buyerId: null, soldTo: null, clientId: 91 });
    const legacy = await storage.createInventoryItem(newWatch());
    expect(legacy.soldTo).toBe("Untrusted name");
    expect(state.clients).toHaveLength(1);
  });
  it("creates a client with only a name and keeps the seller association", async () => {
    const result = await storage.updateInventoryItem(11, { salePrice: 125000 }, { mode: "new", name: "New buyer" });
    expect(state.clients).toHaveLength(2);
    expect(state.clients[1]).toMatchObject({ type: "client", name: "New buyer", email: null, phone: null, country: null });
    expect(result).toMatchObject({ clientId: 91, buyerId: state.clients[1].id, soldTo: "New buyer", salePrice: 125000 });
    expect(fixture.operations).toContain("lock:watch");
    expect(fixture.operations).toContain("lock:contacts");
  });
  it("stores name and email without requiring phone", async () => {
    await storage.updateInventoryItem(11, {}, { mode: "new", name: "New", email: "new@example.invalid" });
    expect(state.clients[1]).toMatchObject({ email: "new@example.invalid", phone: null });
  });
  it("links an existing dealer/client without changing any profile data", async () => {
    const original = structuredClone(state.clients);
    const result = await storage.updateInventoryItem(11, {}, { mode: "existing", clientId: 91 });
    expect(result).toMatchObject({ buyerId: 91, clientId: 91, soldTo: "Existing dealer" });
    expect(state.clients).toEqual(original);
  });
  it("reuses the buyer after retrying a successful name-only save", async () => {
    const first = await storage.updateInventoryItem(11, {}, { mode: "new", name: "Name only" });
    const second = await storage.updateInventoryItem(11, {}, { mode: "new", name: "Name only" });
    expect(second.buyerId).toBe(first.buyerId);
    expect(state.clients).toHaveLength(2);
  });
  it.each([{ email: "SAVED@example.invalid" }, { phone: "+31-6-1234" }])("refuses a duplicate contact without silently linking or overwriting it: %s", async contact => {
    const before = structuredClone(state);
    await expect(storage.updateInventoryItem(11, { salePrice: 999 }, { mode: "new", name: "Duplicate", ...contact })).rejects.toMatchObject({ status: 409 });
    expect(state).toEqual(before);
  });
  it("does not merge different people solely because their names match", async () => {
    await storage.updateInventoryItem(11, {}, { mode: "new", name: "Existing dealer" });
    expect(state.clients).toHaveLength(2);
  });
  it.each(["watch", "expenses"])("rolls back buyer, watch, and expense writes if %s saving fails", async failure => {
    const before = structuredClone(state); fixture.failure = failure;
    await expect(storage.updateInventoryItem(11, { salePrice: 140000, serviceFee: 500 }, { mode: "new", name: "Rollback buyer" })).rejects.toThrow("Fixture failure");
    expect(state).toEqual(before);
  });
  it("rejects a missing watch or deleted selected client without creating anything", async () => {
    await expect(storage.updateInventoryItem(404, {}, { mode: "new", name: "No watch" })).rejects.toMatchObject({ status: 404 });
    await expect(storage.updateInventoryItem(11, {}, { mode: "existing", clientId: 404 })).rejects.toMatchObject({ status: 400 });
    expect(state.clients).toHaveLength(1);
  });
  it("keeps legacy buyer-name-only edits unlinked", async () => {
    await storage.updateInventoryItem(11, { notes: "Only notes changed" });
    expect(state.inventory[0]).toMatchObject({ buyerId: null, soldTo: "Historical name" });
    expect(state.clients).toHaveLength(1);
  });
  it("clears only the buyer when explicitly removing a buyer association", async () => {
    state.inventory[0].buyerId = 91;
    await storage.updateInventoryItem(11, {}, { mode: "none" });
    expect(state.inventory[0]).toMatchObject({ clientId: 91, buyerId: null, soldTo: null });
    expect(state.clients).toHaveLength(1);
  });
  it("protects both buyer and seller links against legacy client deletion", async () => {
    state.inventory[0].buyerId = 91;
    const before = structuredClone(state);
    await expect(storage.deleteClient(91)).rejects.toThrow("retention preview");
    expect(state).toEqual(before);
  });
  it("rejects deletion before attempting any database unlink or delete", async () => {
    state.inventory[0].buyerId = 91;
    const before = structuredClone(state); fixture.failure = "delete";
    await expect(storage.deleteClient(91)).rejects.toThrow("protected");
    expect(fixture.operations).toEqual([]);
    expect(state).toEqual(before);
  });
  it("retains a sold watch's original expense when its fee is edited to zero", async () => {
    state.inventory[0].serviceFee = 500;
    state.expenses.push({
      id: 42, inventoryId: 11, description: "Service Fee - Original invoice",
      amount: 500, date: new Date("2020-01-01Z"), category: "service", isRecurring: false,
    });
    const original = structuredClone(state.expenses[0]);
    await storage.updateInventoryItem(11, { serviceFee: 0 });
    expect(state.inventory[0].serviceFee).toBe(0);
    expect(state.expenses.find(e => e.id === 42)).toEqual(original);
    expect(state.expenses).toContainEqual(expect.objectContaining({
      inventoryId: 11, amount: -500, category: "service",
      description: expect.stringContaining("(correction)"),
    }));
    expect(state.expenses.reduce((sum, expense) => sum + expense.amount, 0)).toBe(0);
    expect(fixture.operations).not.toContain("delete:expenses");
    const count = state.expenses.length;
    await storage.updateInventoryItem(11, { serviceFee: 0 });
    expect(state.expenses).toHaveLength(count);
    await storage.updateInventoryItem(11, { serviceFee: 300 });
    expect(state.expenses.find(e => e.id === 42)).toEqual(original);
    expect(state.expenses.reduce((sum, expense) => sum + expense.amount, 0)).toBe(300);
    await expect(storage.updateExpense(42, { amount: 0 })).rejects.toThrow("history is protected");
    expect(state.expenses.find(e => e.id === 42)).toEqual(original);
  });
  it("rolls back the watch fee change if its correction cannot be recorded", async () => {
    state.inventory[0].serviceFee = 500;
    state.expenses.push({ id: 42, inventoryId: 11, description: "Service Fee - Original", amount: 500 });
    const before = structuredClone(state);
    fixture.failure = "expenses";
    await expect(storage.updateInventoryItem(11, { serviceFee: 0 })).rejects.toThrow("Fixture failure");
    expect(state).toEqual(before);
  });
});
