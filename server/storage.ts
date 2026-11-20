import { db } from "./db";
import { calculateWatchCostBreakdown, calculateWatchFinancials } from "@shared/watch-financials";
import { getSoldDate, normalizeSoldDateFields } from "@shared/sold-date";
import { getSaleAmount } from "@shared/reporting";
import {
  clients, inventory, expenses, inventoryPriceHistory, inventorySales, inventoryReturns,
  personalCollectionWatches, personalCollectionValuations, settings, retentionAudit, transactionParties, dealerNotebookEntries,
  type Client, type InsertClient, type UpdateClientRequest,
  type InventoryItem, type InsertInventory, type UpdateInventoryRequest, type InventoryPriceHistory,
  type InventorySale, type InventoryReturn,
  type Expense, type InsertExpense, type DealerNotebookEntry,
  type PersonalCollectionWatch, type InsertPersonalCollectionWatch,
  type PersonalCollectionValuation, type InsertPersonalCollectionValuation,
  type DashboardStats, type Setting
} from "@shared/schema";
import { eq, desc, sql, and, isNull, isNotNull, inArray, or, ne } from "drizzle-orm";
import { matchingBuyerContact, sameBuyerContact, type SaleBuyerInput } from "@shared/sale-buyer";
import { getMatchingSerialFields, normalizeWatchSerial } from "@shared/serial-match";
import { shouldRecordListedPrice } from "@shared/price-history";
import { RetentionError } from "./retention";
import { retentionKey } from "@shared/retention";
import { DEFAULT_WARRANTY_MONTHS, normalizeWarrantyMonths } from "@shared/warranty";
import type { InventorySaleWithReturns } from "@shared/sales-lifecycle";
import {
  canCaptureNotebookInventory,
  calculateNotebookInventorySnapshot,
  notebookInventorySnapshotSchema,
  type NotebookAction,
  type NotebookComparisonMode,
  type NotebookInventorySnapshot,
  type NotebookPriceInput,
  type NotebookReport,
  type NotebookWatchInput,
} from "@shared/dealers-notebook";

export class SaleBuyerSaveError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export class NotebookSnapshotError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

type ExpenseExecutor = Pick<typeof db, "select" | "insert" | "update" | "delete">;
type BuyerExecutor = ExpenseExecutor & Pick<Parameters<Parameters<typeof db.transaction>[0]>[0], "execute">;
type StorageTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ReturnCaseError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

type CreateInventoryReturn = Pick<InventoryReturn, "requestDate" | "reason">;
type UpdateInventoryReturn = Partial<Omit<InventoryReturn,
  "id" | "saleId" | "createdAt" | "updatedAt" | "cogsRestoredCents" | "completedDate"
>>;

async function resolveSaleBuyer(connection: BuyerExecutor, buyer: SaleBuyerInput, currentBuyerId?: number | null) {
  if (buyer.mode === "none") return { buyerId: null, soldTo: null };
  if (buyer.mode === "existing") {
    const [client] = await connection.select().from(clients).where(eq(clients.id, buyer.clientId));
    if (!client) throw new SaleBuyerSaveError("This client no longer exists. Choose another client.", 400);
    return { buyerId: client.id, soldTo: client.name };
  }
  // Share the lock across creation and edits; names alone are never a match.
  await connection.execute(sql`select pg_advisory_xact_lock(73284077)`);
  const contacts = await connection.select().from(clients);
  const current = contacts.find(client => client.id === currentBuyerId);
  if (current && sameBuyerContact(current, buyer)) return { buyerId: current.id, soldTo: current.name };
  if (contacts.some(client => matchingBuyerContact(client, buyer))) {
    throw new SaleBuyerSaveError("A client with this email or phone already exists. Choose them using Existing client.", 409);
  }
  const [client] = await connection.insert(clients).values({
    name: buyer.name, email: buyer.email || null, phone: buyer.phone || null,
    country: buyer.country || null, type: "client",
  }).returning();
  return { buyerId: client.id, soldTo: client.name };
}

// Fee types that should be synced to expenses
const FEE_TYPES = [
  { field: 'serviceFee', category: 'service' as const, label: 'Service Fee', isBoolean: false },
  { field: 'polishFee', category: 'service' as const, label: 'Polish Fee', isBoolean: false },
  { field: 'platformFees', category: 'platform_fees' as const, label: 'Platform Fees', isBoolean: false },
  { field: 'shippingFee', category: 'shipping' as const, label: 'Shipping Fee', isBoolean: false },
  { field: 'insuranceFee', category: 'insurance' as const, label: 'Insurance Fee', isBoolean: false },
  { field: 'importFee', category: 'other' as const, label: 'Import Fee', isBoolean: false },
  { field: 'watchRegister', category: 'other' as const, label: 'Watch Register Fee', isBoolean: true },
] as const;

function sameInventoryValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left == null || right == null) return false;
  if (left instanceof Date || right instanceof Date) {
    const leftTime = left instanceof Date ? left.getTime() : new Date(left as string).getTime();
    const rightTime = right instanceof Date ? right.getTime() : new Date(right as string).getTime();
    return Number.isFinite(leftTime) && leftTime === rightTime;
  }
  return false;
}

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: UpdateClientRequest): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Inventory
  getInventoryItems(status?: string, includeArchived?: boolean): Promise<(InventoryItem & { seller?: Client })[]>;
  findInventorySerialMatches(serials: unknown[], excludeId?: number): Promise<Array<Pick<InventoryItem, "id" | "brand" | "model" | "referenceNumber" | "serialNumber" | "internalSerial" | "status" | "dateSold" | "soldDate" | "archivedAt"> & { matchedFields: Array<"serialNumber" | "internalSerial"> }>>;
  getArchivedInventoryItems(): Promise<(InventoryItem & { seller?: Client })[]>;
  getInventoryItem(id: number): Promise<(InventoryItem & { expenses?: Expense[] }) | undefined>;
  getInventoryPriceHistory(id: number): Promise<InventoryPriceHistory[]>;
  updateInventoryPriceHistory(inventoryId: number, historyId: number, listPrice: number): Promise<InventoryPriceHistory | undefined>;
  createInventoryItem(item: InsertInventory, saleBuyer?: SaleBuyerInput): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: UpdateInventoryRequest, saleBuyer?: SaleBuyerInput): Promise<InventoryItem>;
  getSales(inventoryId?: number): Promise<InventorySaleWithReturns[]>;
  createInventoryReturn(saleId: number, input: CreateInventoryReturn): Promise<InventoryReturn>;
  updateInventoryReturn(id: number, updates: UpdateInventoryReturn): Promise<InventoryReturn>;
  updateMovementSpecs(id: number, specs: Record<string, string>): Promise<InventoryItem>;
  updateCreditInfo(id: number, updates: { creditPaid?: boolean; creditDueDate?: string | null; creditNotes?: string | null }): Promise<InventoryItem>;
  archiveInventoryItem(id: number): Promise<InventoryItem>;
  restoreInventoryItem(id: number): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;

  // Private personal collection, always scoped to its authenticated owner
  getPersonalCollectionWatches(ownerId: string): Promise<PersonalCollectionWatch[]>;
  getPersonalCollectionWatch(ownerId: string, id: number): Promise<PersonalCollectionWatch | undefined>;
  getPersonalCollectionValuations(ownerId: string, watchId: number): Promise<PersonalCollectionValuation[] | undefined>;
  createPersonalCollectionValuation(ownerId: string, watchId: number, valuation: Pick<InsertPersonalCollectionValuation, "valuationDate" | "estimatedValue">): Promise<PersonalCollectionValuation | undefined>;
  updatePersonalCollectionValuation(ownerId: string, watchId: number, valuationId: number, valuation: Pick<InsertPersonalCollectionValuation, "valuationDate" | "estimatedValue">): Promise<PersonalCollectionValuation | undefined>;
  createPersonalCollectionWatch(ownerId: string, item: InsertPersonalCollectionWatch): Promise<PersonalCollectionWatch>;
  updatePersonalCollectionWatch(ownerId: string, id: number, updates: Partial<InsertPersonalCollectionWatch>): Promise<PersonalCollectionWatch | undefined>;
  deletePersonalCollectionWatch(ownerId: string, id: number): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;

  // Settings
  getAllSettings(): Promise<Record<string, any>>;
  getSetting(key: string): Promise<any>;
  upsertSetting(key: string, value: any): Promise<Setting>;

  // Dealer's Notebook
  getNotebookInventoryData(): Promise<NotebookWatchInput[]>;
  getNotebookPriceHistory(inventoryIds: number[]): Promise<NotebookPriceInput[]>;
  getDealerNotebookEntry(monthKey: string): Promise<DealerNotebookEntry | undefined>;
  captureDealerNotebookInventorySnapshot(monthKey: string): Promise<NotebookInventorySnapshot>;
  saveDealerNotebookContext(monthKey: string, contextNote: string): Promise<DealerNotebookEntry>;
  saveDealerNotebookActions(monthKey: string, actions: NotebookAction[]): Promise<DealerNotebookEntry>;
  saveDealerNotebookReport(
    monthKey: string,
    comparisonMode: NotebookComparisonMode,
    contextNote: string,
    report: NotebookReport,
    actions: NotebookAction[],
  ): Promise<DealerNotebookEntry>;
}

export class DatabaseStorage implements IStorage {
  constructor(private readonly snapshotNow: () => Date = () => new Date()) {}

  async getNotebookInventoryData(): Promise<NotebookWatchInput[]> {
    return db.select({
      id: inventory.id,
      brand: inventory.brand,
      model: inventory.model,
      condition: inventory.condition,
      status: inventory.status,
      archivedAt: inventory.archivedAt,
      purchasePrice: inventory.purchasePrice,
      importFee: inventory.importFee,
      serviceFee: inventory.serviceFee,
      polishFee: inventory.polishFee,
      platformFees: inventory.platformFees,
      shippingFee: inventory.shippingFee,
      insuranceFee: inventory.insuranceFee,
      watchRegister: inventory.watchRegister,
      watchRegisterFeeSnapshot: inventory.watchRegisterFeeSnapshot,
      salePrice: inventory.salePrice,
      soldPrice: inventory.soldPrice,
      soldDate: inventory.soldDate,
      dateSold: inventory.dateSold,
      dateListed: inventory.dateListed,
      listPrice: inventory.listPrice,
      box: inventory.box,
      papers: inventory.papers,
    }).from(inventory);
  }

  async getNotebookPriceHistory(inventoryIds: number[]): Promise<NotebookPriceInput[]> {
    if (!inventoryIds.length) return [];
    return db.select({
      inventoryId: inventoryPriceHistory.inventoryId,
      listPrice: inventoryPriceHistory.listPrice,
      recordedAt: inventoryPriceHistory.recordedAt,
    }).from(inventoryPriceHistory)
      .where(inArray(inventoryPriceHistory.inventoryId, inventoryIds));
  }

  async getDealerNotebookEntry(monthKey: string): Promise<DealerNotebookEntry | undefined> {
    const [entry] = await db.select().from(dealerNotebookEntries)
      .where(eq(dealerNotebookEntries.monthKey, monthKey));
    return entry;
  }

  async captureDealerNotebookInventorySnapshot(monthKey: string): Promise<NotebookInventorySnapshot> {
    return db.transaction(async (tx) => {
      // A single shared lock serializes manual/automatic captures across instances.
      await tx.execute(sql`select pg_advisory_xact_lock(73284078)`);
      const [existing] = await tx.select().from(dealerNotebookEntries)
        .where(eq(dealerNotebookEntries.monthKey, monthKey));
      if (existing?.inventorySnapshot) {
        return notebookInventorySnapshotSchema.parse(existing.inventorySnapshot);
      }
      if (!canCaptureNotebookInventory(monthKey, this.snapshotNow())) {
        throw new NotebookSnapshotError(
          "Month-end inventory can only be captured on the final day of that month in Europe/Amsterdam. Earlier months cannot be reconstructed.",
          409,
        );
      }
      // These locks keep the inventory and register-fee setting consistent while
      // reading; no watch, expense, client or setting row is changed by capture.
      await tx.execute(sql`LOCK TABLE inventory, settings IN SHARE MODE`);
      const now = this.snapshotNow();
      if (!canCaptureNotebookInventory(monthKey, now)) {
        throw new NotebookSnapshotError("Month-end capture was missed. No historical inventory was fabricated.", 409);
      }
      const records = await tx.select().from(inventory);
      const [feeSetting] = await tx.select().from(settings)
        .where(eq(settings.key, "watch_register_fee"));
      const fee = Number(feeSetting?.value ?? 600);
      const snapshot = notebookInventorySnapshotSchema.parse(calculateNotebookInventorySnapshot(
        records,
        monthKey,
        Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : 600,
        now,
      ));
      await tx.insert(dealerNotebookEntries)
        .values({ monthKey, inventorySnapshot: snapshot })
        .onConflictDoUpdate({
          target: dealerNotebookEntries.monthKey,
          set: { inventorySnapshot: snapshot },
          setWhere: isNull(dealerNotebookEntries.inventorySnapshot),
        });
      const [saved] = await tx.select().from(dealerNotebookEntries)
        .where(eq(dealerNotebookEntries.monthKey, monthKey));
      return notebookInventorySnapshotSchema.parse(saved.inventorySnapshot);
    });
  }

  async saveDealerNotebookContext(monthKey: string, contextNote: string): Promise<DealerNotebookEntry> {
    const [entry] = await db.insert(dealerNotebookEntries)
      .values({ monthKey, contextNote })
      .onConflictDoUpdate({
        target: dealerNotebookEntries.monthKey,
        set: { contextNote, updatedAt: new Date() },
      })
      .returning();
    return entry;
  }

  async saveDealerNotebookActions(monthKey: string, actions: NotebookAction[]): Promise<DealerNotebookEntry> {
    const [entry] = await db.insert(dealerNotebookEntries)
      .values({ monthKey, actions })
      .onConflictDoUpdate({
        target: dealerNotebookEntries.monthKey,
        set: { actions, updatedAt: new Date() },
      })
      .returning();
    return entry;
  }

  async saveDealerNotebookReport(
    monthKey: string,
    comparisonMode: NotebookComparisonMode,
    contextNote: string,
    report: NotebookReport,
    actions: NotebookAction[],
  ): Promise<DealerNotebookEntry> {
    const [entry] = await db.insert(dealerNotebookEntries)
      .values({ monthKey, comparisonMode, contextNote, report, actions, generatedAt: new Date() })
      .onConflictDoUpdate({
        target: dealerNotebookEntries.monthKey,
        set: { comparisonMode, contextNote, report, actions, generatedAt: new Date(), updatedAt: new Date() },
      })
      .returning();
    return entry;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    return db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
      const [client] = await tx.insert(clients).values(insertClient).returning();
      return client;
    });
  }

  async updateClient(id: number, updates: UpdateClientRequest): Promise<Client> {
    return db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
      const [client] = await tx.update(clients).set({
        ...updates, profileUpdatedAt: new Date(), profileClearedAt: null,
      }).where(eq(clients.id, id)).returning();
      return client;
    });
  }

  async deleteClient(id: number): Promise<void> {
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
      const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, id));
      if (!client) throw new RetentionError("Client not found.", 404);

      // Preserve watches and transaction details; only clear their links to this profile.
      await tx.update(inventory).set({ clientId: null }).where(eq(inventory.clientId, id));
      await tx.update(inventory).set({ buyerId: null }).where(eq(inventory.buyerId, id));
      await tx.delete(clients).where(eq(clients.id, id));
    });
  }

  // Inventory
  async findInventorySerialMatches(serials: unknown[], excludeId?: number) {
    const normalizedSerials = Array.from(new Set(serials.map(normalizeWatchSerial).filter(Boolean)));
    if (!normalizedSerials.length) return [];

    const serialNumberMatch = sql`regexp_replace(lower(coalesce(${inventory.serialNumber}, '')), '[^a-z0-9]', '', 'g')`;
    const internalSerialMatch = sql`regexp_replace(lower(coalesce(${inventory.internalSerial}, '')), '[^a-z0-9]', '', 'g')`;
    const serialCondition = or(
      inArray(serialNumberMatch, normalizedSerials),
      inArray(internalSerialMatch, normalizedSerials),
    );
    const matches = await db.select({
      id: inventory.id,
      brand: inventory.brand,
      model: inventory.model,
      referenceNumber: inventory.referenceNumber,
      serialNumber: inventory.serialNumber,
      internalSerial: inventory.internalSerial,
      status: inventory.status,
      dateSold: inventory.dateSold,
      soldDate: inventory.soldDate,
      archivedAt: inventory.archivedAt,
    }).from(inventory).where(
      excludeId == null ? serialCondition : and(serialCondition, ne(inventory.id, excludeId)),
    ).orderBy(desc(inventory.purchaseDate));

    return matches.map((watch) => ({
      ...watch,
      matchedFields: getMatchingSerialFields(watch, serials),
    }));
  }

  async getInventoryItems(status?: string, includeArchived = false): Promise<(InventoryItem & { seller?: Client })[]> {
    const conditions = [];
    if (status) conditions.push(eq(inventory.status, status as any));
    if (!includeArchived) conditions.push(isNull(inventory.archivedAt));

    const query = db.select({ item: inventory, seller: clients })
      .from(inventory)
      .leftJoin(clients, eq(inventory.clientId, clients.id));
    const rows = await query
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(inventory.purchaseDate));

    return rows.map(({ item, seller }) => ({ ...item, seller: seller ?? undefined }));
  }

  async getArchivedInventoryItems(): Promise<(InventoryItem & { seller?: Client })[]> {
    const rows = await db.select({ item: inventory, seller: clients })
      .from(inventory)
      .leftJoin(clients, eq(inventory.clientId, clients.id))
      .where(isNotNull(inventory.archivedAt))
      .orderBy(desc(inventory.archivedAt));
    return rows.map(({ item, seller }) => ({ ...item, seller: seller ?? undefined }));
  }

  private async setInventoryArchived(id: number, archived: boolean): Promise<InventoryItem> {
    return db.transaction(async tx => {
      const [current] = await tx.select().from(inventory).where(eq(inventory.id, id));
      if (!current) throw new Error("Item not found");

      const currentlyArchived = current.archivedAt != null;
      if (currentlyArchived === archived) return current;

      const [updated] = await tx.update(inventory)
        .set({ archivedAt: archived ? new Date() : null })
        .where(eq(inventory.id, id))
        .returning();
      if (!updated) throw new Error("Item not found");

      await tx.insert(retentionAudit).values({
        action: archived ? "watch_archived" : "watch_restored",
        recordId: id,
      });
      return updated;
    });
  }

  async archiveInventoryItem(id: number): Promise<InventoryItem> {
    return this.setInventoryArchived(id, true);
  }

  async restoreInventoryItem(id: number): Promise<InventoryItem> {
    return this.setInventoryArchived(id, false);
  }

  async getInventoryItem(id: number): Promise<(InventoryItem & { expenses?: Expense[] }) | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    if (!item) return undefined;

    const itemExpenses = await db.select().from(expenses).where(eq(expenses.inventoryId, id));
    return { ...item, expenses: itemExpenses };
  }

  async getInventoryPriceHistory(id: number): Promise<InventoryPriceHistory[]> {
    return db.select().from(inventoryPriceHistory)
      .where(eq(inventoryPriceHistory.inventoryId, id))
      .orderBy(desc(inventoryPriceHistory.recordedAt), desc(inventoryPriceHistory.id));
  }

  async updateInventoryPriceHistory(inventoryId: number, historyId: number, listPrice: number): Promise<InventoryPriceHistory | undefined> {
    const [entry] = await db.update(inventoryPriceHistory)
      .set({ listPrice })
      .where(and(
        eq(inventoryPriceHistory.id, historyId),
        eq(inventoryPriceHistory.inventoryId, inventoryId),
      ))
      .returning();
    return entry;
  }

  private async recordCurrentSaleCycle(
    tx: StorageTransaction,
    item: InventoryItem,
    previous?: InventoryItem,
  ): Promise<void> {
    if (item.status !== "sold") return;

    const existingSales = await tx.select().from(inventorySales)
      .where(eq(inventorySales.inventoryId, item.id));
    const latest = existingSales.sort((a, b) => b.cycleNumber - a.cycleNumber)[0];
    const latestReturns = latest
      ? await tx.select().from(inventoryReturns).where(eq(inventoryReturns.saleId, latest.id))
      : [];
    const hasReturned = latestReturns.some(record => record.receivedDate != null);
    const beginsNewCycle = !latest
      || hasReturned
      || (previous != null && previous.status !== "sold");

    const [feeSetting] = item.watchRegisterFeeSnapshot == null
      ? await tx.select().from(settings).where(eq(settings.key, "watch_register_fee"))
      : [];
    const registerFee = item.watchRegisterFeeSnapshot ?? Number(feeSetting?.value ?? 600);
    const salePrice = getSaleAmount(item) ?? 0;
    const cost = calculateWatchCostBreakdown(item, Number.isFinite(registerFee) ? registerFee : 600);
    const financials = calculateWatchFinancials(item, salePrice, 0, registerFee, true);
    const snapshot = {
      inventoryId: item.id,
      brandSnapshot: item.brand,
      modelSnapshot: item.model,
      referenceNumberSnapshot: item.referenceNumber,
      serialNumberSnapshot: item.serialNumber,
      salePrice,
      soldTo: item.soldTo,
      buyerId: item.buyerId,
      platformFees: item.platformFees ?? 0,
      chrono24FeeRate: item.chrono24FeeRate,
      shippingFee: item.shippingFee ?? 0,
      insuranceFee: item.insuranceFee ?? 0,
      soldDate: getSoldDate(item),
      soldPlatform: item.soldPlatform,
      shippingPartner: item.shippingPartner,
      trackingNumber: item.trackingNumber,
      dateShipped: item.dateShipped,
      deliveredDate: item.deliveredDate,
      purchaseDateSnapshot: item.purchaseDate,
      dateListedSnapshot: item.dateListed,
      purchasePriceSnapshot: cost.purchasePriceCents,
      importFeeSnapshot: cost.importFeeCents,
      serviceFeeSnapshot: cost.serviceFeeCents,
      polishFeeSnapshot: cost.polishFeeCents,
      watchRegisterFeeSnapshot: cost.watchRegisterFeeCents,
      watchRegisterSnapshot: Boolean(item.watchRegister),
      acquisitionCostCents: cost.acquisitionCostsCents,
      profitAtSaleCents: financials.profitCents,
      updatedAt: new Date(),
    };

    if (beginsNewCycle) {
      await tx.insert(inventorySales).values({
        ...snapshot,
        cycleNumber: (latest?.cycleNumber ?? 0) + 1,
      });
      return;
    }
    await tx.update(inventorySales).set(snapshot).where(eq(inventorySales.id, latest.id));
  }

  async getSales(inventoryId?: number): Promise<InventorySaleWithReturns[]> {
    const saleRows = await db.select().from(inventorySales)
      .where(inventoryId == null ? undefined : eq(inventorySales.inventoryId, inventoryId))
      .orderBy(desc(inventorySales.soldDate), desc(inventorySales.id));
    if (!saleRows.length) return [];
    const returnRows = await db.select().from(inventoryReturns)
      .where(inArray(inventoryReturns.saleId, saleRows.map(sale => sale.id)))
      .orderBy(desc(inventoryReturns.createdAt));
    const returnsBySale = new Map<number, InventoryReturn[]>();
    for (const record of returnRows) {
      const group = returnsBySale.get(record.saleId) ?? [];
      group.push(record);
      returnsBySale.set(record.saleId, group);
    }
    return saleRows.map(sale => ({ ...sale, returns: returnsBySale.get(sale.id) ?? [] }));
  }

  async createInventoryReturn(saleId: number, input: CreateInventoryReturn): Promise<InventoryReturn> {
    return db.transaction(async tx => {
      const [sale] = await tx.select().from(inventorySales)
        .where(eq(inventorySales.id, saleId)).for("update");
      if (!sale) throw new ReturnCaseError("Sale record not found.", 404);
      const existingCases = await tx.select().from(inventoryReturns)
        .where(eq(inventoryReturns.saleId, saleId));
      if (existingCases.some(record => !["cancelled", "declined"].includes(record.status))) {
        throw new ReturnCaseError("This sale already has an open or completed return case.", 409);
      }
      const [record] = await tx.insert(inventoryReturns).values({
        saleId,
        status: "requested",
        requestDate: input.requestDate,
        reason: input.reason,
        shippingCostCents: 0,
        shippingPayer: "seller",
        refundAmountCents: 0,
        inspectionCostCents: 0,
        nextAction: "hold",
        cogsRestoredCents: 0,
        platformFeeRefunded: false,
      }).returning();
      return record;
    });
  }

  async updateInventoryReturn(id: number, updates: UpdateInventoryReturn): Promise<InventoryReturn> {
    return db.transaction(async tx => {
      const [current] = await tx.select().from(inventoryReturns)
        .where(eq(inventoryReturns.id, id)).for("update");
      if (!current) throw new ReturnCaseError("Return case not found.", 404);
      const [sale] = await tx.select().from(inventorySales)
        .where(eq(inventorySales.id, current.saleId)).for("update");
      if (!sale) throw new ReturnCaseError("The linked sale record could not be found.", 404);

      const status = updates.status ?? current.status;
      const wasReceived = current.receivedDate != null;
      if (wasReceived && (status === "cancelled" || status === "declined")) {
        throw new ReturnCaseError("A received return cannot be cancelled or declined.", 409);
      }
      let receivedDate = updates.receivedDate === undefined ? current.receivedDate : updates.receivedDate;
      if (["received", "inspected", "completed"].includes(status) && !receivedDate) {
        receivedDate = this.snapshotNow().toISOString().slice(0, 10);
      }
      if (status === "completed" && !receivedDate) {
        throw new ReturnCaseError("Receive and inspect the watch before completing its return.", 409);
      }
      let returnShippedDate = updates.returnShippedDate === undefined
        ? current.returnShippedDate
        : updates.returnShippedDate;
      if (status === "in_transit" && !returnShippedDate) {
        returnShippedDate = this.snapshotNow().toISOString().slice(0, 10);
      }
      const completedDate = status === "completed"
        ? (current.completedDate ?? this.snapshotNow().toISOString().slice(0, 10))
        : current.completedDate;
      const isChrono24Sale = /chrono\s*24/i.test(sale.soldPlatform ?? "");
      const platformFeeRefunded = status === "completed" && isChrono24Sale
        ? true
        : updates.platformFeeRefunded ?? current.platformFeeRefunded;
      const savedFields = {
        ...updates,
        status,
        receivedDate,
        returnShippedDate,
        completedDate,
        cogsRestoredCents: receivedDate ? sale.acquisitionCostCents : 0,
        platformFeeRefunded,
        updatedAt: this.snapshotNow(),
      };
      const [saved] = await tx.update(inventoryReturns).set(savedFields)
        .where(eq(inventoryReturns.id, id)).returning();

      if (sale.inventoryId != null && receivedDate) {
        const nextAction = updates.nextAction ?? current.nextAction;
        const inspectionComplete = ["inspected", "completed"].includes(status);
        const nextInventoryStatus = inspectionComplete
          ? nextAction === "relist" ? "in_stock" : nextAction === "service" ? "servicing" : "received"
          : "received";
        const watchUpdates: Partial<InventoryItem> = { status: nextInventoryStatus };
        if (inspectionComplete && nextAction === "relist") {
          watchUpdates.dateListed = null;
        }
        if (!wasReceived) {
          Object.assign(watchUpdates, {
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
        }
        const [watch] = await tx.update(inventory).set(watchUpdates)
          .where(eq(inventory.id, sale.inventoryId)).returning();
        if (watch) await this.syncWatchFeesToExpenses(watch, tx);
      }
      return saved;
    });
  }

  async createInventoryItem(insertItem: InsertInventory, saleBuyer?: SaleBuyerInput): Promise<InventoryItem> {
    // Snapshot the current watch_register_fee so future admin-panel changes
    // don't retroactively affect this item's cost calculations.
    const currentFee = await this.getSetting("watch_register_fee") || 600;
    const warrantyTerm = insertItem.storeWarrantyMonths === undefined
      ? normalizeWarrantyMonths(await this.getSetting("default_warranty_months") ?? DEFAULT_WARRANTY_MONTHS)
      : insertItem.storeWarrantyMonths;
    const itemWithSnapshot = {
      ...normalizeSoldDateFields(insertItem),
      storeWarrantyMonths: warrantyTerm,
      watchRegisterFeeSnapshot: currentFee,
      chrono24CertificationSentAt: insertItem.chrono24CertificationSent ? new Date() : null,
    };
    return db.transaction(async tx => {
      const buyer = saleBuyer ? await resolveSaleBuyer(tx, saleBuyer) : {};
      const [item] = await tx.insert(inventory).values({ ...itemWithSnapshot, ...buyer }).returning();
      if (shouldRecordListedPrice(null, item.listPrice)) {
        await tx.insert(inventoryPriceHistory).values({ inventoryId: item.id, listPrice: item.listPrice! });
      }
      await this.syncWatchFeesToExpenses(item, tx);
      await this.recordCurrentSaleCycle(tx, item);
      return item;
    });
  }

  async updateInventoryItem(id: number, updates: UpdateInventoryRequest, saleBuyer?: SaleBuyerInput): Promise<InventoryItem> {
    const normalizedUpdates = normalizeSoldDateFields(updates);
    // Delivery-only confirmation never rewrites or corrects financial records.
    if (!saleBuyer && Object.keys(updates).every(key => key === "deliveredDate")) {
      const [item] = await db.update(inventory).set(normalizedUpdates).where(eq(inventory.id, id)).returning();
      if (!item) throw new Error("Item not found");
      return item;
    }
    return db.transaction(async tx => {
      // Serialize fee corrections as well as buyer changes. Watch and expense
      // totals commit together; retries cannot append duplicate corrections.
      const [current] = await tx.select().from(inventory).where(eq(inventory.id, id)).for("update");
      if (!current) throw new SaleBuyerSaveError("Watch not found.", 404);
      const buyer = saleBuyer ? await resolveSaleBuyer(tx, saleBuyer, current.buyerId) : {};
      const certificationDateUpdate = "chrono24CertificationSent" in normalizedUpdates
        ? {
            chrono24CertificationSentAt: normalizedUpdates.chrono24CertificationSent
              ? (current.chrono24CertificationSent ? current.chrono24CertificationSentAt : new Date())
              : null,
          }
        : {};
      const [item] = await tx.update(inventory).set({ ...normalizedUpdates, ...certificationDateUpdate, ...buyer })
        .where(eq(inventory.id, id)).returning();
      if (shouldRecordListedPrice(current.listPrice, updates.listPrice)) {
        await tx.insert(inventoryPriceHistory).values({ inventoryId: id, listPrice: updates.listPrice! });
      }
      await this.syncWatchFeesToExpenses(item, tx);
      const saleCycleFields = [
        "status", "salePrice", "soldPrice", "soldTo", "buyerId", "platformFees", "chrono24FeeRate",
        "shippingFee", "insuranceFee", "soldDate", "dateSold", "soldPlatform", "shippingPartner",
        "trackingNumber", "dateShipped", "deliveredDate", "purchasePrice", "importFee", "serviceFee",
        "polishFee", "watchRegister", "watchRegisterFeeSnapshot", "purchaseDate", "dateListed",
        "brand", "model", "referenceNumber", "serialNumber",
      ];
      if (saleBuyer || saleCycleFields.some(field =>
        Object.prototype.hasOwnProperty.call(normalizedUpdates, field)
        && !sameInventoryValue((current as any)[field], (normalizedUpdates as any)[field]))) {
        await this.recordCurrentSaleCycle(tx, item, current);
      }
      return item;
    });
  }

  async updateMovementSpecs(id: number, specs: Record<string, string>): Promise<InventoryItem> {
    const [item] = await db.update(inventory).set({ movementSpecs: specs }).where(eq(inventory.id, id)).returning();
    return item;
  }

  async updateCreditInfo(id: number, updates: { creditPaid?: boolean; creditDueDate?: string | null; creditNotes?: string | null }): Promise<InventoryItem> {
    const payload: Record<string, any> = {};
    if (updates.creditPaid !== undefined) payload.creditPaid = updates.creditPaid;
    if ("creditDueDate" in updates) payload.creditDueDate = updates.creditDueDate ? new Date(updates.creditDueDate) : null;
    if ("creditNotes" in updates) payload.creditNotes = updates.creditNotes ?? null;
    const [item] = await db.update(inventory).set(payload).where(eq(inventory.id, id)).returning();
    if (!item) throw new Error("Item not found");
    return item;
  }

  // Sync watch fees to expense entries
  private async syncWatchFeesToExpenses(item: InventoryItem, connection: ExpenseExecutor = db): Promise<void> {
    const watchRef = `${item.brand} ${item.model} - Ref#${item.referenceNumber}`;
    const feeDate = item.purchaseDate || new Date();
    // Use per-item snapshot if available, otherwise fall back to current setting
    const [feeSetting] = item.watchRegisterFeeSnapshot == null
      ? await connection.select().from(settings).where(eq(settings.key, "watch_register_fee"))
      : [];
    const watchRegisterFee = item.watchRegisterFeeSnapshot ?? (feeSetting?.value as number | undefined) ?? 600;

    for (const feeType of FEE_TYPES) {
      let feeValue: number;
      if (feeType.isBoolean) {
        const boolValue = (item as any)[feeType.field];
        feeValue = boolValue ? watchRegisterFee : 0;
      } else {
        feeValue = (item as any)[feeType.field] || 0;
      }
      
      const description = `${feeType.label} - ${watchRef}`;

      // Find existing expense for this fee type and inventory item
      const existingExpenses = await connection.select().from(expenses)
        .where(and(
          eq(expenses.inventoryId, item.id),
          sql`${expenses.description} LIKE ${`${feeType.label}%`}`
        ));

      // Preserve originals, including their amounts and dates. An append-only
      // correction brings the sum to the current fee, even when it becomes zero.
      const recordedTotal = existingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const correction = feeValue - recordedTotal;
      if (correction !== 0) {
        await connection.insert(expenses).values({
          inventoryId: item.id,
          description: existingExpenses.length ? `${description} (correction)` : description,
          amount: correction,
          date: existingExpenses.length ? new Date() : feeDate,
          category: feeType.category,
          isRecurring: false,
        });
      }
    }
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.transaction(async tx => {
      const [watch] = await tx.select({ id: inventory.id }).from(inventory).where(eq(inventory.id, id));
      if (!watch) throw new RetentionError("Watch not found.", 404);

      // Keep linked records, but clear their pointer to the deleted watch.
      await tx.update(expenses).set({ inventoryId: null }).where(eq(expenses.inventoryId, id));
      await tx.update(transactionParties).set({ inventoryId: null }).where(eq(transactionParties.inventoryId, id));
      await tx.update(inventoryPriceHistory).set({ inventoryId: null }).where(eq(inventoryPriceHistory.inventoryId, id));
      await tx.delete(inventory).where(eq(inventory.id, id));
    });
  }

  async getPersonalCollectionWatches(ownerId: string): Promise<PersonalCollectionWatch[]> {
    return db.select().from(personalCollectionWatches)
      .where(eq(personalCollectionWatches.ownerId, ownerId))
      .orderBy(desc(personalCollectionWatches.dateBought), desc(personalCollectionWatches.createdAt));
  }

  async getPersonalCollectionWatch(ownerId: string, id: number): Promise<PersonalCollectionWatch | undefined> {
    const [watch] = await db.select().from(personalCollectionWatches).where(and(
      eq(personalCollectionWatches.ownerId, ownerId),
      eq(personalCollectionWatches.id, id),
    ));
    return watch;
  }

  async getPersonalCollectionValuations(ownerId: string, watchId: number): Promise<PersonalCollectionValuation[] | undefined> {
    const watch = await this.getPersonalCollectionWatch(ownerId, watchId);
    if (!watch) return undefined;
    return db.select().from(personalCollectionValuations)
      .where(eq(personalCollectionValuations.watchId, watchId))
      .orderBy(
        desc(personalCollectionValuations.valuationDate),
        desc(personalCollectionValuations.createdAt),
        desc(personalCollectionValuations.id),
      );
  }

  private async getLatestPersonalCollectionEstimate(
    connection: Pick<typeof db, "select">,
    watchId: number,
  ): Promise<{ hasEntry: boolean; estimatedValue: number | null }> {
    const [latest] = await connection.select({ estimatedValue: personalCollectionValuations.estimatedValue })
      .from(personalCollectionValuations)
      .where(eq(personalCollectionValuations.watchId, watchId))
      .orderBy(
        desc(personalCollectionValuations.valuationDate),
        desc(personalCollectionValuations.createdAt),
        desc(personalCollectionValuations.id),
      )
      .limit(1);
    return { hasEntry: Boolean(latest), estimatedValue: latest?.estimatedValue ?? null };
  }

  private async syncPersonalCollectionLatestEstimate(
    connection: Pick<typeof db, "select" | "update">,
    watchId: number,
  ): Promise<number | null> {
    const { estimatedValue } = await this.getLatestPersonalCollectionEstimate(connection, watchId);
    await connection.update(personalCollectionWatches)
      .set({ estimatedValue, updatedAt: new Date() })
      .where(eq(personalCollectionWatches.id, watchId));
    return estimatedValue;
  }

  async createPersonalCollectionValuation(
    ownerId: string,
    watchId: number,
    valuation: Pick<InsertPersonalCollectionValuation, "valuationDate" | "estimatedValue">,
  ): Promise<PersonalCollectionValuation | undefined> {
    return db.transaction(async (tx) => {
      const [watch] = await tx.select({ id: personalCollectionWatches.id })
        .from(personalCollectionWatches)
        .where(and(
          eq(personalCollectionWatches.ownerId, ownerId),
          eq(personalCollectionWatches.id, watchId),
        ))
        .for("update");
      if (!watch) return undefined;

      const [created] = await tx.insert(personalCollectionValuations)
        .values({ ...valuation, watchId })
        .returning();
      await this.syncPersonalCollectionLatestEstimate(tx, watchId);
      return created;
    });
  }

  async updatePersonalCollectionValuation(
    ownerId: string,
    watchId: number,
    valuationId: number,
    valuation: Pick<InsertPersonalCollectionValuation, "valuationDate" | "estimatedValue">,
  ): Promise<PersonalCollectionValuation | undefined> {
    return db.transaction(async (tx) => {
      const [watch] = await tx.select({ id: personalCollectionWatches.id })
        .from(personalCollectionWatches)
        .where(and(
          eq(personalCollectionWatches.ownerId, ownerId),
          eq(personalCollectionWatches.id, watchId),
        ))
        .for("update");
      if (!watch) return undefined;

      const [updated] = await tx.update(personalCollectionValuations)
        .set({ ...valuation, updatedAt: new Date() })
        .where(and(
          eq(personalCollectionValuations.watchId, watchId),
          eq(personalCollectionValuations.id, valuationId),
        ))
        .returning();
      if (!updated) return undefined;
      await this.syncPersonalCollectionLatestEstimate(tx, watchId);
      return updated;
    });
  }

  async createPersonalCollectionWatch(ownerId: string, item: InsertPersonalCollectionWatch): Promise<PersonalCollectionWatch> {
    const [watch] = await db.insert(personalCollectionWatches).values({ ...item, ownerId }).returning();
    return watch;
  }

  async updatePersonalCollectionWatch(
    ownerId: string,
    id: number,
    updates: Partial<InsertPersonalCollectionWatch>,
  ): Promise<PersonalCollectionWatch | undefined> {
    return db.transaction(async (tx) => {
      const [current] = await tx.select({ id: personalCollectionWatches.id })
        .from(personalCollectionWatches)
        .where(and(
          eq(personalCollectionWatches.ownerId, ownerId),
          eq(personalCollectionWatches.id, id),
        ))
        .for("update");
      if (!current) return undefined;

      const latestEstimate = await this.getLatestPersonalCollectionEstimate(tx, id);
      const updatesWithCurrentEstimate = latestEstimate.hasEntry
        ? { ...updates, estimatedValue: latestEstimate.estimatedValue }
        : updates;
      const [watch] = await tx.update(personalCollectionWatches)
        .set({ ...updatesWithCurrentEstimate, updatedAt: new Date() })
        .where(and(
          eq(personalCollectionWatches.ownerId, ownerId),
          eq(personalCollectionWatches.id, id),
        ))
        .returning();
      return watch;
    });
  }

  async deletePersonalCollectionWatch(ownerId: string, id: number): Promise<boolean> {
    const [deleted] = await db.delete(personalCollectionWatches)
      .where(and(
        eq(personalCollectionWatches.ownerId, ownerId),
        eq(personalCollectionWatches.id, id),
      ))
      .returning({ id: personalCollectionWatches.id });
    return Boolean(deleted);
  }

  // Expenses
  async getExpenses(): Promise<(Expense & { inventory?: InventoryItem })[]> {
    const rows = await db.select({ expense: expenses, inventory: inventory })
      .from(expenses)
      .leftJoin(inventory, eq(expenses.inventoryId, inventory.id))
      .orderBy(desc(expenses.date));
    return rows.map(({ expense, inventory: linkedInventory }) => ({
      ...expense,
      inventory: linkedInventory ?? undefined,
    }));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense> {
    const original = await this.getExpense(id);
    if (!original) throw new Error("Expense not found");
    if (original.inventoryId && FEE_TYPES.some(fee => original.description.startsWith(fee.label))) {
      throw new RetentionError("Watch-fee expense history is protected. Correct the fee on the watch to record an adjustment without changing the original expense.");
    }
    const [expense] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    if (!expense) {
      throw new Error("Expense not found");
    }
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    const [deleted] = await db.delete(expenses).where(eq(expenses.id, id)).returning({ id: expenses.id });
    if (!deleted) throw new Error("Expense not found");
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const currentWrFee = await this.getSetting("watch_register_fee") || 600;
    const allInventory = await db.select({
      status: inventory.status,
      archivedAt: inventory.archivedAt,
      purchaseDate: inventory.purchaseDate,
      soldDate: inventory.soldDate,
      dateSold: inventory.dateSold,
      purchasePrice: inventory.purchasePrice,
      importFee: inventory.importFee,
      serviceFee: inventory.serviceFee,
      polishFee: inventory.polishFee,
      watchRegister: inventory.watchRegister,
      watchRegisterFeeSnapshot: inventory.watchRegisterFeeSnapshot,
      platformFees: inventory.platformFees,
      shippingFee: inventory.shippingFee,
      insuranceFee: inventory.insuranceFee,
      salePrice: inventory.salePrice,
      soldPrice: inventory.soldPrice,
    }).from(inventory);
    
    const activeInventory = allInventory.filter(i => !i.archivedAt && i.status !== 'sold');
    const soldInventory = allInventory.filter(i => i.status === 'sold');
    
    const totalInventoryValue = activeInventory.reduce((sum, item) => {
      const basePrice = item.purchasePrice || 0;
      const wrFee = item.watchRegisterFeeSnapshot ?? currentWrFee;
      const watchRegisterFee = item.watchRegister ? wrFee : 0;
      return sum + basePrice + watchRegisterFee;
    }, 0);
    
    const totalProfit = soldInventory.reduce((sum, item) => {
      const sold = getSaleAmount(item) ?? 0;
      if (sold === 0) return sum;

      return sum + calculateWatchFinancials(item, sold, 0, currentWrFee).profitCents;
    }, 0);

    // Turn rate calculation (simplified: avg days held for sold items)
    let totalDays = 0;
    let soldCount = 0;
    
    soldInventory.forEach(item => {
      const purchaseDate = item.purchaseDate;
      const soldDate = getSoldDate(item);

      if (soldDate && purchaseDate) {
        const diffTime = Math.abs(soldDate.getTime() - purchaseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        totalDays += diffDays;
        soldCount++;
      }
    });
    
    const turnRate = soldCount > 0 ? Math.round(totalDays / soldCount) : 0;

    return {
      totalInventoryValue,
      totalProfit,
      activeInventoryCount: activeInventory.length,
      soldInventoryCount: soldInventory.length,
      turnRate
    };
  }

  // Settings
  async getAllSettings(): Promise<Record<string, any>> {
    const rows = await db.select().from(settings);
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async getSetting(key: string): Promise<any> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return row?.value ?? null;
  }

  async upsertSetting(key: string, value: any): Promise<Setting> {
    if (key === retentionKey) throw new RetentionError("Use the dedicated retention schedule approval controls.");
    const [result] = await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
