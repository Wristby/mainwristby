import type { Express } from "express";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { isAuthenticated } from "./auth";
import { clients, inventory } from "@shared/schema";
import {
  buyerReviewPath, buyerReviewSchema, buyerSyncPath, planLegacyBuyers,
  type BuyerReviewInput, type BuyerSyncReport,
} from "@shared/client-backfill";

class BuyerBackfillError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function syncHistoricalBuyers(): Promise<BuyerSyncReport> {
  return db.transaction(async tx => {
    // Same ordering as a watch edit: lock watch rows before the shared contact lock.
    // Concurrent visits/retries cannot create two profiles for a single watch.
    const watches = await tx.select({
      id: inventory.id, brand: inventory.brand, model: inventory.model,
      referenceNumber: inventory.referenceNumber, soldTo: inventory.soldTo, buyerId: inventory.buyerId,
    }).from(inventory).where(isNull(inventory.buyerId)).orderBy(asc(inventory.id)).for("update");
    await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
    const contacts = await tx.select().from(clients);
    const { ready, pending } = planLegacyBuyers(watches, contacts);
    for (const { watch, name } of ready) {
      const [client] = await tx.insert(clients).values({ name, type: "client" }).returning();
      // Keep the historical name snapshot, seller, fees, and all other watch data intact.
      await tx.update(inventory).set({ buyerId: client.id }).where(eq(inventory.id, watch.id));
    }
    return { created: ready.length, pending };
  });
}

export async function resolveHistoricalBuyer(input: BuyerReviewInput) {
  return db.transaction(async tx => {
    const [watch] = await tx.select().from(inventory).where(eq(inventory.id, input.watchId)).for("update");
    if (!watch) throw new BuyerBackfillError("This watch no longer exists.", 404);
    if (watch.buyerId != null || watch.soldTo?.trim() !== input.expectedName) {
      throw new BuyerBackfillError("The watch buyer has changed. Refresh the review list before linking.", 409);
    }
    await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
    let clientId: number;
    if (input.action === "link") {
      const [client] = await tx.select().from(clients).where(eq(clients.id, input.clientId));
      if (!client) throw new BuyerBackfillError("This Client no longer exists. Choose another Client.", 409);
      clientId = client.id;
    } else {
      const [client] = await tx.insert(clients).values({ name: input.expectedName, type: "client" }).returning();
      clientId = client.id;
    }
    await tx.update(inventory).set({ buyerId: clientId }).where(eq(inventory.id, watch.id));
    return { watchId: watch.id, clientId };
  });
}

export function registerClientBackfillRoutes(app: Express) {
  app.post(buyerSyncPath, isAuthenticated, async (_req, res, next) => {
    try { res.json(await syncHistoricalBuyers()); } catch (error) { next(error); }
  });
  app.post(buyerReviewPath, isAuthenticated, async (req, res, next) => {
    try {
      res.json(await resolveHistoricalBuyer(buyerReviewSchema.parse(req.body)));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Choose a valid watch and Client review action." });
      if (error instanceof BuyerBackfillError) return res.status(error.status).json({ message: error.message });
      next(error);
    }
  });
}
