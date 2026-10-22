import { createHash, randomUUID } from "node:crypto";
import type { Express } from "express";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { isAuthenticated } from "./auth";
import { clients, inventory, expenses, settings, retentionHolds, retentionAudit, retentionPolicies, transactionParties } from "@shared/schema";
import { expiry, profileFields, retentionKey, scheduleInputSchema,
  type RetentionSchedule, type RetentionPreview } from "@shared/retention";

type Connection = Pick<typeof db, "select" | "insert" | "update" | "execute">;
export class RetentionError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}

export async function readSchedule(connection: Connection = db): Promise<RetentionSchedule | null> {
  const [row] = await connection.select().from(settings).where(eq(settings.key, retentionKey));
  if (!row) return null;
  const stored = row.value as RetentionSchedule;
  // Metadata is server-owned and is not accepted through the generic settings API.
  const { revision, approvedAt, automaticDeletionEnabled, ...input } = stored;
  const valid = scheduleInputSchema.safeParse(input);
  if (!valid.success || typeof revision !== "string" ||
      (approvedAt !== null && !Number.isFinite(Date.parse(approvedAt)))) {
    throw new RetentionError("Saved retention schedule is invalid. Save a reviewed schedule.", 409);
  }
  return { ...valid.data, revision, approvedAt,
    automaticDeletionEnabled: false };
}

export async function previewClient(id: number, connection: Connection = db): Promise<RetentionPreview> {
  const [client] = await connection.select().from(clients).where(eq(clients.id, id));
  if (!client) throw new RetentionError("Client not found.", 404);
  const watches = await connection.select().from(inventory).where(or(eq(inventory.buyerId, id), eq(inventory.clientId, id)));
  const ids = watches.map(w => w.id);
  const linkedExpenses = ids.length
    ? await connection.select().from(expenses).where(inArray(expenses.inventoryId, ids)) : [];
  const holds = await connection.select().from(retentionHolds).where(and(
    isNull(retentionHolds.releasedAt),
    or(and(eq(retentionHolds.scope, "client"), eq(retentionHolds.recordId, id)),
      ...(ids.length ? [and(eq(retentionHolds.scope, "inventory"), inArray(retentionHolds.recordId, ids))] : [])),
  ));
  const schedule = await readSchedule(connection);
  const blockers: string[] = [];
  if (!schedule?.approvedAt || !schedule.confirmApproval || !schedule.backup.verified) {
    blockers.push("An owner- and adviser-approved category schedule and verified backup expiry are required.");
  }
  if (holds.length) blockers.push("An active legal hold prevents cleanup.");
  if (client.profileClearedAt) blockers.push("Optional profile details have already been cleared.");
  const activityDates = [client.createdAt, client.profileUpdatedAt,
    ...watches.flatMap(w => [w.purchaseDate, w.dateReceived, w.dateSold, w.soldDate, w.dateShipped, w.deliveredDate])];
  const validDates = activityDates.filter((d): d is Date | string => !!d && Number.isFinite(new Date(d).getTime()));
  const lastActivity = validDates.length ? new Date(Math.max(...validDates.map(d => new Date(d).getTime()))) : null;
  const profileExpiry = schedule ? expiry(lastActivity, schedule.rules.optional_profile.days) : null;
  if (!profileExpiry) blockers.push("The optional-profile start date or retention rule is missing.");
  else if (new Date(profileExpiry).getTime() > Date.now()) blockers.push("The optional-profile retention period has not expired.");
  // Missing transaction dates never imply expiration. These categories are
  // review-only: this operation never deletes financial or warranty records.
  const categoryDates: RetentionPreview["categories"] = [{
    category: "optional_profile", trigger: "last_activity", eligibleAfter: profileExpiry,
    action: "Clear optional CRM profile only, after approval and legal-hold checks.",
  }];
  for (const category of ["financial", "warranty"] as const) {
    const dates = watches.map(w => category === "financial"
      ? expiry(w.dateSold || w.soldDate || w.purchaseDate, schedule?.rules.financial.days ?? 0, true)
      : expiry(w.deliveredDate, schedule?.rules.warranty.days ?? 0));
    categoryDates.push({
      category, trigger: category === "financial" ? "financial_year_end" : "delivery",
      eligibleAfter: schedule && dates.length && dates.every(Boolean) ? dates.sort().at(-1)! : null,
      action: "Retain; expiry is for review only. Missing dates require manual review.",
    });
  }
  const fingerprint = createHash("sha256").update(JSON.stringify({
    client, watches: watches.sort((a,b) => a.id-b.id),
    expenses: linkedExpenses.sort((a,b) => a.id-b.id), holds: holds.sort((a,b) => a.id-b.id), schedule,
  })).digest("hex");
  return {
    clientId: id, eligible: blockers.length === 0, blockers, clear: profileFields,
    retain: ["Buyer and seller names in transaction records (including legacy soldTo / purchasedFrom).",
      "Watch identifiers, purchase/sale amounts and dates, delivery/warranty evidence, and linked expenses.",
      "Profile ID and transaction links; deletion audit without contact details.",
      "Possible personal data in watch notes, attachments, exports, UPS and backups: separate manual review required."],
    holds: holds.map(h => ({ id: h.id, scope: h.scope, recordId: h.recordId, reason: h.reason })),
    categories: categoryDates, linkedWatchIds: ids, expenseCount: linkedExpenses.length, fingerprint,
  };
}

export async function clearClient(id: number, fingerprint: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(73284088)`);
    // Includes parent tables to exclude concurrent new links and fee writes,
    // not just updates to the rows seen by the earlier preview.
    await tx.execute(sql`LOCK TABLE clients, inventory, expenses, settings, retention_holds, transaction_parties IN SHARE ROW EXCLUSIVE MODE`);
    const preview = await previewClient(id, tx);
    if (preview.fingerprint !== fingerprint) throw new RetentionError("Records changed. Refresh and review the preview again.");
    if (!preview.eligible) throw new RetentionError(preview.blockers.join(" "));
    const [client] = await tx.select().from(clients).where(eq(clients.id, id));
    for (const watchId of preview.linkedWatchIds) {
      const [watch] = await tx.select().from(inventory).where(eq(inventory.id, watchId));
      for (const role of ["buyer", "seller"] as const) {
        if ((role === "buyer" ? watch.buyerId : watch.clientId) !== id) continue;
        await tx.insert(transactionParties).values({
          inventoryId: watchId, role,
          name: (role === "buyer" ? watch.soldTo : watch.purchasedFrom) || client.name,
        });
      }
    }
    await tx.update(clients).set({
      name: `Cleared client #${id}`, email: null, phone: null, socialHandle: null,
      website: null, country: null, notes: null, isVip: false, profileClearedAt: new Date(),
    }).where(eq(clients.id, id));
    const schedule = await readSchedule(tx);
    await tx.insert(retentionAudit).values({ action: "profile_cleared", recordId: id, revision: schedule!.revision });
    return { cleared: true, retainedTransactionRecords: true };
  });
}

const idSchema = z.coerce.number().int().positive();
export function registerRetentionRoutes(app: Express) {
  // All existing accounts have the same trusted-workspace permission level.
  // Approval fields are attestations/references, not a claim of independent sign-off.
  const route = (method: "get" | "put" | "post", path: string, handler: (req: any) => Promise<unknown>) => {
    app[method](path, isAuthenticated, async (req, res) => {
      try { res.json(await handler(req)); }
      catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0]?.message });
        if (error instanceof RetentionError) return res.status(error.status).json({ message: error.message });
        throw error;
      }
    });
  };
  route("get", "/api/retention/schedule", () => readSchedule());
  route("get", "/api/retention/inventory/:id/parties", req =>
    db.select().from(transactionParties).where(eq(transactionParties.inventoryId, idSchema.parse(req.params.id))));
  route("put", "/api/retention/schedule", async req => {
    const input = scheduleInputSchema.parse(req.body);
    const schedule: RetentionSchedule = {
      ...input, revision: randomUUID(), approvedAt: input.confirmApproval ? new Date().toISOString() : null,
      automaticDeletionEnabled: false,
    };
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284088)`);
      await tx.insert(settings).values({ key: retentionKey, value: schedule })
        .onConflictDoUpdate({ target: settings.key, set: { value: schedule } });
      await tx.insert(retentionPolicies).values({ revision: schedule.revision, schedule });
      await tx.insert(retentionAudit).values({ action: schedule.approvedAt ? "schedule_approved" : "schedule_drafted", revision: schedule.revision });
    });
    return schedule;
  });
  route("get", "/api/retention/clients/:id/preview", req => previewClient(idSchema.parse(req.params.id)));
  route("post", "/api/retention/clients/:id/clear", req => {
    const { fingerprint } = z.object({ fingerprint: z.string().regex(/^[0-9a-f]{64}$/) }).strict().parse(req.body);
    return clearClient(idSchema.parse(req.params.id), fingerprint);
  });
  route("get", "/api/retention/holds", () => db.select().from(retentionHolds).where(isNull(retentionHolds.releasedAt)));
  route("post", "/api/retention/holds", async req => {
    const hold = z.object({
      scope: z.enum(["client", "inventory"]), recordId: idSchema,
      reason: z.string().trim().min(1).max(1000),
    }).strict().parse(req.body);
    return db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284088)`);
      const table = hold.scope === "client" ? clients : inventory;
      const [record] = await tx.select({ id: table.id }).from(table).where(eq(table.id, hold.recordId));
      if (!record) throw new RetentionError("Record not found.", 404);
      const [saved] = await tx.insert(retentionHolds).values(hold).returning();
      await tx.insert(retentionAudit).values({ action: "hold_placed", recordId: saved.id });
      return saved;
    });
  });
  route("post", "/api/retention/holds/:id/release", async req => {
    const id = idSchema.parse(req.params.id);
    const { reason } = z.object({ reason: z.string().trim().min(1).max(1000) }).strict().parse(req.body);
    return db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284088)`);
      const [hold] = await tx.update(retentionHolds).set({ releasedAt: new Date(), releaseReason: reason })
        .where(and(eq(retentionHolds.id, id), isNull(retentionHolds.releasedAt))).returning();
      if (!hold) throw new RetentionError("Active hold not found.", 404);
      await tx.insert(retentionAudit).values({ action: "hold_released", recordId: id });
      return hold;
    });
  });
}
