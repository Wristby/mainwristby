import { beforeEach, describe, expect, it, vi } from "vitest";
import { expiry, scheduleInputSchema, type RetentionSchedule } from "@shared/retention";

const harness = vi.hoisted(() => ({
  rows: [] as any[][],
  writes: [] as { table: unknown; values: any }[],
  returningRows: [] as any[][],
  execute: vi.fn(),
}));
vi.mock("../../../server/db", () => {
  const connection: any = {
    select: () => ({ from: () => ({ where: async () => {
      if (!harness.rows.length) throw new Error("Unexpected database read");
      return harness.rows.shift();
    } }) }),
    insert: (table: unknown) => ({ values: (values: any) => {
      harness.writes.push({ table, values });
      return Promise.resolve();
    } }),
    update: (table: unknown) => ({ set: (values: any) => ({ where: () => {
      let recorded = false;
      const record = () => {
        if (!recorded) {
          harness.writes.push({ table, values });
          recorded = true;
        }
      };
      const query = Promise.resolve().then(record);
      return Object.assign(query, {
        returning: async () => {
          record();
          return harness.returningRows.shift() ?? [];
        },
      });
    } }) }),
    delete: (table: unknown) => ({ where: async () => {
      harness.writes.push({ table, deleted: true });
    } }),
    execute: harness.execute,
    transaction: (callback: (tx: unknown) => unknown) => callback(connection),
  };
  return { db: connection };
});
vi.mock("../../../server/auth", () => ({ isAuthenticated: vi.fn() }));
import { clearClient, previewClient, readSchedule } from "../../../server/retention";
import { DatabaseStorage } from "../../../server/storage";
import { clients, expenses, inventory, retentionAudit, retentionHolds, transactionParties } from "@shared/schema";

const approved: RetentionSchedule = {
  rules: {
    optional_profile: { purpose: "CRM follow-up", trigger: "last_activity", days: 0 },
    financial: { purpose: "Approved accounting requirement", trigger: "financial_year_end", days: 2700 },
    warranty: { purpose: "Approved warranty evidence", trigger: "delivery", days: 365 },
  },
  backup: { expiryDays: 45, procedure: "Verified provider expiry and isolated restore ledger procedure.", verified: true },
  ownerApproval: "Owner approval document reference", adviserApproval: "Adviser approval document reference",
  confirmApproval: true, revision: "test-revision", approvedAt: "2020-01-01T00:00:00.000Z",
  automaticDeletionEnabled: false,
};
const client = {
  id: 1, name: "Fixture Buyer", email: "fixture@example.invalid", phone: "fixture-phone",
  socialHandle: "fixture", website: "fixture.invalid", country: "NL", notes: "optional CRM note", isVip: true,
  createdAt: new Date("2020-01-01Z"), profileUpdatedAt: new Date("2020-01-01Z"), profileClearedAt: null,
};
const watch = {
  id: 11, buyerId: 1, clientId: 1, soldTo: "Transaction Buyer", purchasedFrom: "Transaction Seller",
  purchaseDate: new Date("2020-01-02Z"), dateSold: new Date("2020-02-02Z"),
  deliveredDate: "2020-02-06", purchasePrice: 100, salePrice: 200,
};
function seed(options: { schedule?: RetentionSchedule | null; client?: any; watches?: any[]; holds?: any[] } = {}) {
  const watches = options.watches ?? [watch];
  harness.rows.push([options.client ?? client], watches);
  if (watches.length) harness.rows.push([{ id: 21, inventoryId: 11, amount: 25 }]);
  harness.rows.push(options.holds ?? [], (options.schedule === null ? [] : [{ value: options.schedule ?? approved }]));
}
beforeEach(() => {
  harness.rows = [];
  harness.writes = [];
  harness.returningRows = [];
  harness.execute.mockReset();
});

describe("retention policy and dates", () => {
  it("does not supply default periods or accept a blanket/wrong category trigger", () => {
    expect(scheduleInputSchema.safeParse({}).success).toBe(false);
    const { revision, approvedAt, automaticDeletionEnabled, ...input } = approved;
    expect(scheduleInputSchema.safeParse(input).success).toBe(true);
    expect(scheduleInputSchema.safeParse({ ...input, rules: { ...input.rules, financial: input.rules.optional_profile } }).success).toBe(false);
    expect(scheduleInputSchema.safeParse({ ...input, backup: { ...input.backup, verified: false } }).success).toBe(false);
    expect(scheduleInputSchema.safeParse({ ...input, automaticDeletionEnabled: true }).success).toBe(false);
  });
  it("uses UTC calendar-year end and never treats an absent date as expired", () => {
    expect(expiry("2020-07-03", 1, true)).toBe("2021-01-02T00:00:00.000Z");
    expect(expiry("2020-02-28", 1)).toBe("2020-02-29T00:00:00.000Z");
    expect(expiry(null, 100)).toBeNull();
    expect(expiry("invalid", 100)).toBeNull();
  });
  it("starts with no approved schedule", async () => {
    harness.rows.push([]);
    expect(await readSchedule()).toBeNull();
  });
});

describe("reviewable profile cleanup", () => {
  it("blocks missing approval even when profile activity is old", async () => {
    seed({ schedule: null });
    const preview = await previewClient(1);
    expect(preview.eligible).toBe(false);
    expect(preview.blockers.join(" ")).toContain("approved");
    expect(harness.writes).toEqual([]);
  });
  it("blocks drafts, unexpired profiles and already-cleared profiles", async () => {
    seed({ schedule: { ...approved, approvedAt: null, confirmApproval: false } });
    expect((await previewClient(1)).eligible).toBe(false);
    seed({ client: { ...client, profileUpdatedAt: new Date("2099-01-01Z") } });
    expect((await previewClient(1)).blockers.join(" ")).toContain("has not expired");
    seed({ client: { ...client, profileClearedAt: new Date() } });
    expect((await previewClient(1)).blockers.join(" ")).toContain("already");
  });
  it("a client or linked-watch legal hold prevents clearance", async () => {
    for (const scope of ["client", "inventory"]) {
      seed({ holds: [{ id: 3, scope, recordId: scope === "client" ? 1 : 11, reason: "Pending dispute" }] });
      const preview = await previewClient(1);
      expect(preview.eligible).toBe(false);
      expect(preview.blockers).toContain("An active legal hold prevents cleanup.");
    }
  });
  it("shows separated categories, protected identities and expenses without deleting anything", async () => {
    seed();
    const preview = await previewClient(1);
    expect(preview.eligible).toBe(true);
    expect(preview.categories.map(c => c.category)).toEqual(["optional_profile", "financial", "warranty"]);
    expect(preview.clear).toContain("email");
    expect(preview.retain.join(" ")).toContain("names in transaction records");
    expect(preview.expenseCount).toBe(1);
    expect(harness.writes).toEqual([]);
  });
  it("retains undated transactions for manual review", async () => {
    seed({ watches: [{ ...watch, deliveredDate: null, dateSold: null, purchaseDate: null }] });
    const preview = await previewClient(1);
    expect(preview.categories.find(c => c.category === "warranty")?.eligibleAfter).toBeNull();
    expect(preview.categories.find(c => c.category === "financial")?.eligibleAfter).toBeNull();
    expect(preview.retain.join(" ")).toContain("expenses");
  });
  it("rejects a stale preview before any changes", async () => {
    seed();
    const preview = await previewClient(1);
    seed({ client: { ...client, notes: "changed after preview" } });
    await expect(clearClient(1, preview.fingerprint)).rejects.toThrow("Records changed");
    expect(harness.writes).toEqual([]);
  });
  it("rechecks eligibility even when a blocked fingerprint matches", async () => {
    const holds = [{ id: 3, scope: "client", recordId: 1, reason: "Dispute" }];
    seed({ holds });
    const preview = await previewClient(1);
    seed({ holds });
    await expect(clearClient(1, preview.fingerprint)).rejects.toThrow("legal hold");
    expect(harness.writes).toEqual([]);
  });
  it("clears optional profile details and snapshots only transaction identity", async () => {
    seed();
    const preview = await previewClient(1);
    seed();
    harness.rows.push([client], [watch], [{ value: approved }]);
    await expect(clearClient(1, preview.fingerprint)).resolves.toEqual({ cleared: true, retainedTransactionRecords: true });
    const parties = harness.writes.filter(w => w.table === transactionParties).map(w => w.values);
    expect(parties).toEqual([
      { inventoryId: 11, role: "buyer", name: "Transaction Buyer" },
      { inventoryId: 11, role: "seller", name: "Transaction Seller" },
    ]);
    const profile = harness.writes.find(w => w.table === clients)!.values;
    expect(profile).toMatchObject({ name: "Cleared client #1", email: null, phone: null, notes: null, isVip: false });
    expect(profile.buyerId).toBeUndefined();
    const audit = harness.writes.find(w => w.table === retentionAudit)!.values;
    expect(audit).toEqual({ action: "profile_cleared", recordId: 1, revision: "test-revision" });
    expect(harness.execute).toHaveBeenCalledTimes(2);
    expect(harness.rows).toHaveLength(0);
  });
  it("keeps a watch protected while an active retention hold exists", async () => {
    const storage = new DatabaseStorage();
    harness.rows.push([{ id: 11 }], [{ id: 3, scope: "inventory", recordId: 11, releasedAt: null }]);
    await expect(storage.deleteInventoryItem(11)).rejects.toThrow("active retention hold");
    expect(harness.writes).toEqual([]);
  });
  it("archives and restores a watch without changing its other fields", async () => {
    const storage = new DatabaseStorage();
    const original = { ...watch, archivedAt: null };
    const archivedAt = new Date("2026-10-26T12:00:00.000Z");

    harness.rows.push([original]);
    harness.returningRows.push([{ ...original, archivedAt }]);
    const archived = await storage.archiveInventoryItem(11);
    expect(archived).toMatchObject({ id: 11, archivedAt });
    expect(harness.writes).toEqual([
      { table: inventory, values: { archivedAt: expect.any(Date) } },
      { table: retentionAudit, values: { action: "watch_archived", recordId: 11 } },
    ]);

    harness.writes = [];
    harness.rows.push([{ ...original, archivedAt }]);
    harness.returningRows.push([{ ...original, archivedAt: null }]);
    const restored = await storage.restoreInventoryItem(11);
    expect(restored).toMatchObject({ id: 11, archivedAt: null });
    expect(harness.writes).toEqual([
      { table: inventory, values: { archivedAt: null } },
      { table: retentionAudit, values: { action: "watch_restored", recordId: 11 } },
    ]);
  });
  it("deletes only the watch and keeps linked expense and transaction-party records detached", async () => {
    const storage = new DatabaseStorage();
    harness.rows.push([{ id: 11 }], []);
    await expect(storage.deleteInventoryItem(11)).resolves.toBeUndefined();
    expect(harness.writes).toEqual([
      { table: expenses, values: { inventoryId: null } },
      { table: transactionParties, values: { inventoryId: null } },
      { table: inventory, deleted: true },
      { table: retentionAudit, values: { action: "watch_deleted_records_retained", recordId: 11 } },
    ]);
  });
  it("rejects missing watches and generic settings bypass without touching records", async () => {
    const storage = new DatabaseStorage();
    harness.rows.push([]);
    await expect(storage.deleteInventoryItem(11)).rejects.toThrow("Watch not found");
    await expect(storage.deleteClient(1)).rejects.toThrow("retention preview");
    await expect(storage.deleteExpense(21)).rejects.toThrow("protected");
    await expect(storage.upsertSetting("client_retention_schedule", approved)).rejects.toThrow("dedicated");
    expect(harness.writes).toEqual([]);
    expect(harness.rows).toHaveLength(0);
  });
});
