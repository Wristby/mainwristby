import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const fixture = vi.hoisted(() => ({ db: { transaction: vi.fn() } }));
vi.mock("../../../server/db", () => ({ db: fixture.db }));
import { DatabaseStorage } from "../../../server/storage";

const dialect = new PgDialect();
let state: Record<string, any[]>;

function connection(getState: () => Record<string, any[]>) {
  const query = (kind: string, initialTable?: any) => {
    let table = initialTable;
    let condition: any;
    let values: any;
    const execute = () => {
      const name = getTableName(table);
      const rows = getState()[name] ?? (getState()[name] = []);
      const matches = (row: any) => {
        if (!condition) return true;
        const { sql, params } = dialect.sqlToQuery(condition);
        const columnName = sql.match(/"[^"]+"\."([^"]+)"\s*=\s*\$1/)?.[1];
        const field = Object.entries(getTableColumns(table)).find(([, col]: any) => col.name === columnName)?.[0];
        const equal = field ? row[field] === params[0] : true;
        return equal && (!sql.includes("LIKE") || row.description?.startsWith(String(params[1]).replace(/%$/, "")));
      };
      if (kind === "select") return rows.filter(matches).map(row => ({ ...row }));
      if (kind === "insert") {
        const row = { id: Math.max(0, ...rows.map(row => row.id ?? 0)) + 1, ...values };
        rows.push(row);
        return [{ ...row }];
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
      for() { return builder; },
      orderBy() { return builder; },
      set(value: any) { values = value; return builder; },
      values(value: any) { values = value; return builder; },
      returning() { return Promise.resolve().then(execute); },
      then(resolve: any, reject: any) { return Promise.resolve().then(execute).then(resolve, reject); },
    };
    return builder;
  };
  return {
    select: () => query("select"),
    insert: (table: any) => query("insert", table),
    update: (table: any) => query("update", table),
    delete: (table: any) => query("delete", table),
    execute: async () => undefined,
  };
}

beforeEach(() => {
  state = {
    inventory: [{
      id: 9,
      brand: "Rolex",
      model: "Submariner",
      referenceNumber: "126610",
      serialNumber: "ABC",
      status: "sold",
      purchasePrice: 700000,
      importFee: 0,
      serviceFee: 0,
      polishFee: 0,
      watchRegister: false,
      watchRegisterFeeSnapshot: 600,
      salePrice: 1000000,
      soldPrice: 1000000,
      soldTo: "Buyer",
      buyerId: 3,
      platformFees: 65000,
      chrono24FeeRate: 650,
      shippingFee: 10000,
      insuranceFee: 5000,
      soldDate: new Date("2026-01-10T00:00:00.000Z"),
      dateSold: new Date("2026-01-10T00:00:00.000Z"),
      soldPlatform: "Chrono24",
      shippingPartner: "UPS",
      trackingNumber: "OUTBOUND",
      dateShipped: null,
      deliveredDate: null,
      purchaseDate: new Date("2025-11-10T00:00:00.000Z"),
      dateListed: new Date("2025-11-15T00:00:00.000Z"),
    }],
    inventory_sales: [{
      id: 20,
      inventoryId: 9,
      cycleNumber: 1,
      brandSnapshot: "Rolex",
      modelSnapshot: "Submariner",
      referenceNumberSnapshot: "126610",
      serialNumberSnapshot: "ABC",
      salePrice: 1000000,
      soldTo: "Buyer",
      buyerId: 3,
      platformFees: 65000,
      chrono24FeeRate: 650,
      shippingFee: 10000,
      insuranceFee: 5000,
      soldDate: new Date("2026-01-10T00:00:00.000Z"),
      soldPlatform: "Chrono24",
      purchasePriceSnapshot: 700000,
      importFeeSnapshot: 0,
      serviceFeeSnapshot: 0,
      polishFeeSnapshot: 0,
      watchRegisterFeeSnapshot: 0,
      watchRegisterSnapshot: false,
      acquisitionCostCents: 700000,
      profitAtSaleCents: 220000,
      createdAt: new Date("2026-01-10T00:00:00.000Z"),
      updatedAt: new Date("2026-01-10T00:00:00.000Z"),
    }],
    inventory_returns: [],
    expenses: [],
    settings: [],
    clients: [],
  };
  fixture.db.transaction.mockImplementation(async (callback: (tx: any) => unknown) => {
    const snapshot = structuredClone(state);
    const result = await callback(connection(() => snapshot));
    state = snapshot;
    return result;
  });
  Object.assign(fixture.db, connection(() => state));
});

describe("sale returns and resale persistence", () => {
  it("logs returns without changing inventory or expenses, while preserving later resale cycles", async () => {
    const storage = new DatabaseStorage(() => new Date("2026-02-01T12:00:00.000Z"));
    const created = await storage.createInventoryReturn(20, {
      requestDate: "2026-02-01",
      reason: "Buyer requested a return",
    });
    expect(created.status).toBe("requested");

    const received = await storage.updateInventoryReturn(created.id, {
      status: "received",
      receivedDate: "2026-02-06",
      refundAmountCents: 1000000,
      refundDate: "2026-02-06",
      shippingCostCents: 5000,
      shippingPayer: "seller",
      nextAction: "relist",
    });
    expect(received.cogsRestoredCents).toBe(700000);
    expect(received.platformFeeRefunded).toBe(false);
    expect(state.inventory[0]).toMatchObject({
      status: "sold",
      purchasePrice: 700000,
      salePrice: 1000000,
      soldTo: "Buyer",
      platformFees: 65000,
      soldDate: new Date("2026-01-10T00:00:00.000Z"),
    });
    expect(state.expenses).toHaveLength(0);
    expect(state.inventory_sales[0]).toMatchObject({
      salePrice: 1000000,
      soldTo: "Buyer",
      profitAtSaleCents: 220000,
      purchasePriceSnapshot: 700000,
    });

    const completed = await storage.updateInventoryReturn(created.id, {
      status: "completed",
      refundAmountCents: 1000000,
      refundDate: "2026-02-07",
      nextAction: "relist",
    });
    expect(completed.platformFeeRefunded).toBe(true);
    expect(state.inventory[0]).toMatchObject({
      status: "sold",
      salePrice: 1000000,
      soldDate: new Date("2026-01-10T00:00:00.000Z"),
    });
    expect(state.expenses).toHaveLength(0);

    // Inventory changes are made explicitly, outside the return editor.
    await storage.updateInventoryItem(9, {
      status: "in_stock",
      salePrice: 0,
      soldPrice: null,
      soldTo: null,
      buyerId: null,
      platformFees: 0,
      chrono24FeeRate: null,
      shippingFee: 0,
      insuranceFee: 0,
      soldDate: null,
      dateSold: null,
      soldPlatform: null,
      shippingPartner: null,
      trackingNumber: null,
      dateShipped: null,
      deliveredDate: null,
    });
    await storage.updateInventoryItem(9, {
      status: "sold",
      salePrice: 1200000,
      soldPrice: 1200000,
      soldTo: "Second buyer",
      buyerId: null,
      soldDate: new Date("2026-03-10T00:00:00.000Z"),
      soldPlatform: "Direct",
      platformFees: 0,
      shippingFee: 8000,
      insuranceFee: 0,
    });
    expect(state.inventory[0].purchasePrice).toBe(700000);
    expect(state.inventory_sales).toHaveLength(2);
    expect(state.inventory_sales[1]).toMatchObject({
      cycleNumber: 2,
      purchasePriceSnapshot: 700000,
      salePrice: 1200000,
      soldTo: "Second buyer",
    });
    expect(state.inventory_returns[0].saleId).toBe(state.inventory_sales[0].id);
  });
});
