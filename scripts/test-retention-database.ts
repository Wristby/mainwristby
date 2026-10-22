// Opt-in development smoke test. All fixture records and temporary approvals
// are rolled back; it does not sign in or create an application account.
import "dotenv/config";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { clients, inventory, expenses, settings, retentionHolds, transactionParties } from "../shared/schema";
import { retentionKey, type RetentionSchedule } from "../shared/retention";
import { clearClient, previewClient, RetentionError } from "../server/retention";
import { DatabaseStorage } from "../server/storage";

if (process.env.NODE_ENV === "production" || !process.argv.includes("--development-rollback")) {
  throw new Error("Run only against development with --development-rollback.");
}
const rollback = new Error("ROLLBACK_FIXTURES");
const schedule: RetentionSchedule = {
  rules: {
    optional_profile: { purpose: "Development rollback fixture", trigger: "last_activity", days: 0 },
    financial: { purpose: "Development rollback fixture", trigger: "financial_year_end", days: 2700 },
    warranty: { purpose: "Development rollback fixture", trigger: "delivery", days: 365 },
  },
  backup: { expiryDays: 30, procedure: "Development rollback fixture; not a real backup verification.", verified: true },
  ownerApproval: "Fixture only, rolled back", adviserApproval: "Fixture only, rolled back",
  confirmApproval: true, approvedAt: "2020-01-01T00:00:00.000Z", revision: "rollback-fixture",
  automaticDeletionEnabled: false,
};
try {
  await db.transaction(async tx => {
    const [client] = await tx.insert(clients).values({
      name: "Rollback Fixture", email: "rollback@example.invalid",
      notes: "Optional fixture notes", profileUpdatedAt: new Date("2020-01-01Z"),
      createdAt: new Date("2020-01-01Z"),
    }).returning();
    const [watch] = await tx.insert(inventory).values({
      brand: "Fixture", model: "Rollback", referenceNumber: "ROLLBACK-ONLY",
      purchasePrice: 100, targetSellPrice: 200, salePrice: 200, condition: "Good",
      serviceFee: 500,
      status: "sold", buyerId: client.id, soldTo: "Transaction Fixture",
      dateSold: new Date("2020-01-01Z"), purchaseDate: new Date("2020-01-01Z"),
      deliveredDate: "2020-01-05",
    }).returning();
    const [expense] = await tx.insert(expenses).values({
      inventoryId: watch.id, amount: 20, description: "Rollback expense",
    }).returning();
    const [feeExpense] = await tx.insert(expenses).values({
      inventoryId: watch.id, amount: 500, description: "Service Fee - Rollback original", category: "service",
    }).returning();
    await tx.insert(settings).values({ key: retentionKey, value: schedule })
      .onConflictDoUpdate({ target: settings.key, set: { value: schedule } });
    const first = await previewClient(client.id, tx);
    assert(first.eligible);
    const [hold] = await tx.insert(retentionHolds).values({
      scope: "inventory", recordId: watch.id, reason: "Rollback fixture dispute",
    }).returning();
    assert(!(await previewClient(client.id, tx)).eligible);
    await tx.update(retentionHolds).set({ releasedAt: new Date(), releaseReason: "Rollback fixture release" })
      .where(eq(retentionHolds.id, hold.id));
    // Exercise the production clear function against this enclosing rollback
    // transaction, keeping temporary schedule/fixtures invisible to the app.
    const originalTransaction = db.transaction;
    (db as any).transaction = async (callback: (connection: typeof tx) => unknown) => callback(tx);
    try {
      await new DatabaseStorage().updateInventoryItem(watch.id, { serviceFee: 0 });
      const feeHistory = await tx.select().from(expenses).where(eq(expenses.inventoryId, watch.id));
      assert.equal(feeHistory.find(e => e.id === feeExpense.id)?.amount, 500);
      assert(feeHistory.some(e => e.amount === -500 && e.description.endsWith("(correction)")));
      assert.equal(feeHistory.reduce((total, e) => total + e.amount, 0), 20);
      await tx.update(clients).set({ notes: "Fixture changed" }).where(eq(clients.id, client.id));
      await assert.rejects(clearClient(client.id, first.fingerprint), error =>
        error instanceof RetentionError && error.message.includes("Records changed"));
      const fresh = await previewClient(client.id, tx);
      assert(fresh.eligible);
      await clearClient(client.id, fresh.fingerprint);
      const [cleared] = await tx.select().from(clients).where(eq(clients.id, client.id));
      assert.equal(cleared.email, null);
      assert.equal(cleared.notes, null);
      assert(cleared.profileClearedAt);
      const [preservedWatch] = await tx.select().from(inventory).where(eq(inventory.id, watch.id));
      assert.equal(preservedWatch.buyerId, client.id);
      assert.equal(preservedWatch.soldTo, "Transaction Fixture");
      assert.equal(preservedWatch.salePrice, 200);
      const [preservedExpense] = await tx.select().from(expenses).where(eq(expenses.id, expense.id));
      assert.equal(preservedExpense.amount, 20);
      const parties = await tx.select().from(transactionParties).where(eq(transactionParties.inventoryId, watch.id));
      assert.equal(parties.length, 1);
      assert.equal(parties[0].name, "Transaction Fixture");
      assert(!(await previewClient(client.id, tx)).eligible);
    } finally {
      db.transaction = originalTransaction;
    }
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) {
    console.error("Retention database rollback test failed. No fixture changes were committed.");
    process.exitCode = 1;
  } else {
    console.log("Retention database smoke test passed: holds, stale preview, profile clearance, retained identities/expenses. All fixture changes rolled back.");
  }
} finally {
  await pool.end();
}
