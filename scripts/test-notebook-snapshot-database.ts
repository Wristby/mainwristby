// Isolated PostgreSQL integration check. Never run against an app database.
// Start a disposable local cluster on 55439, then set DATABASE_URL to this exact fixture URL.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import { dealerNotebookEntries, inventory, expenses, settings } from "../shared/schema";
import { DatabaseStorage } from "../server/storage";
import { prepareNotebookAnalysis } from "../server/dealers-notebook";
import { notebookReportSchema } from "../shared/dealers-notebook";

const fixtureUrl = "postgresql://notebook_fixture@127.0.0.1:55439/notebook_snapshot_test";
if (process.env.DATABASE_URL !== fixtureUrl || !process.argv.includes("--isolated")) {
  throw new Error("This test requires --isolated and a disposable local fixture database.");
}

try {
  const migration = await readFile("migrations/0013_dealer_notebook_inventory_snapshot.sql", "utf8");
  await db.execute(sql.raw(migration));
  await db.execute(sql.raw(migration));
  await db.insert(settings).values({ key: "watch_register_fee", value: 600 });
  await db.insert(inventory).values([
    {
      brand: "Snapshot fixture", model: "Listed", referenceNumber: "FIXTURE-1", condition: "Excellent",
      purchasePrice: 100_100, importFee: 250, serviceFee: 400, polishFee: 300,
      watchRegister: true, watchRegisterFeeSnapshot: 550, status: "in_stock",
      targetSellPrice: 150_000, listPrice: 150_099, dateListed: new Date("2026-09-01T12:00:00Z"),
      notes: "Private fixture note", serialNumber: "PRIVATE-FIXTURE-SERIAL",
    },
    {
      brand: "Snapshot fixture", model: "Not listed", referenceNumber: "FIXTURE-2", condition: "Good",
      purchasePrice: 200_000, watchRegister: true, status: "servicing", targetSellPrice: 250_000,
    },
    {
      brand: "Snapshot fixture", model: "Sold", referenceNumber: "FIXTURE-3", condition: "Good",
      purchasePrice: 900_000, status: "sold", targetSellPrice: 950_000, listPrice: 950_000,
    },
    {
      brand: "Snapshot fixture", model: "Archived", referenceNumber: "FIXTURE-4", condition: "Good",
      purchasePrice: 800_000, status: "in_stock", archivedAt: new Date("2026-09-02T12:00:00Z"),
      targetSellPrice: 850_000,
    },
  ]);
  await db.insert(expenses).values({ description: "Unchanged expense", amount: 100, category: "other" });
  const originalInventory = await db.select().from(inventory);
  const originalExpenses = await db.select().from(expenses);
  const storage = new DatabaseStorage(() => new Date("2026-09-30T21:59:59.000Z"));
  await storage.saveDealerNotebookContext("2026-09", "Keep this notebook note");

  const captures = await Promise.all(Array.from({ length: 4 }, () =>
    storage.captureDealerNotebookInventorySnapshot("2026-09")));
  for (const capture of captures) assert.deepEqual(capture, captures[0]);
  const snapshot = captures[0];
  assert.equal(snapshot.activeWatchCount, 2);
  assert.equal(snapshot.listedWatchCount, 1);
  assert.equal(snapshot.costBasisCents, 302_200);
  assert.equal(snapshot.listingValueCents, 150_099);
  assert(!JSON.stringify(snapshot).includes("PRIVATE-FIXTURE-SERIAL"));
  assert(!JSON.stringify(snapshot).includes("Private fixture note"));
  assert.deepEqual(await db.select().from(inventory), originalInventory);
  assert.deepEqual(await db.select().from(expenses), originalExpenses);
  assert.equal((await storage.getDealerNotebookEntry("2026-09"))?.contextNote, "Keep this notebook note");
  assert.equal((await db.select().from(dealerNotebookEntries)).length, 1);

  // Subsequent edits, archive changes and deletions must not rewrite the capture.
  await db.update(inventory).set({ purchasePrice: 1, listPrice: 2, status: "sold" })
    .where(eq(inventory.model, "Listed"));
  await db.delete(inventory).where(eq(inventory.model, "Not listed"));
  await storage.saveDealerNotebookContext("2026-09", "Updated notebook note");
  await storage.saveDealerNotebookActions("2026-09", []);
  const prepared = prepareNotebookAnalysis([], [], "2026-09", "previous-month", 600, "");
  const report = notebookReportSchema.parse({
    period: prepared.period, comparison: prepared.comparison, currentStock: prepared.currentStock,
    inventorySnapshots: [snapshot], overview: "Fixture report", wins: [], challenges: [],
    improvements: [], recommendations: [], evidence: {}, dataCaveats: [],
    generatedAt: "2026-10-10T12:00:00.000Z",
  });
  await storage.saveDealerNotebookReport("2026-09", "previous-month", "Report note", report, []);
  const restarted = new DatabaseStorage(() => new Date("2026-11-15T12:00:00Z"));
  assert.deepEqual(await restarted.captureDealerNotebookInventorySnapshot("2026-09"), snapshot);
  assert.deepEqual((await restarted.getDealerNotebookEntry("2026-09"))?.inventorySnapshot, snapshot);
  assert.deepEqual((await restarted.getDealerNotebookEntry("2026-09"))?.report?.inventorySnapshots, [snapshot]);
  await assert.rejects(() => restarted.captureDealerNotebookInventorySnapshot("2026-10"), /final day/);
  await assert.rejects(() => restarted.captureDealerNotebookInventorySnapshot("2026-12"), /final day/);
  assert.equal(await restarted.getDealerNotebookEntry("2026-10"), undefined);
  assert.equal(await restarted.getDealerNotebookEntry("2026-12"), undefined);
  console.log("PASS: real PostgreSQL capture is concurrent-safe, durable, idempotent, migration-repeatable and non-mutating; report saves and later watch changes preserve it. No app data or accounts were used.");
} finally {
  await pool.end();
}
