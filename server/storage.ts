import { db } from "./db";
import { calculateWatchFinancials } from "@shared/watch-financials";
import { getSoldDate, normalizeSoldDateFields } from "@shared/sold-date";
import { getSaleAmount } from "@shared/reporting";
import {
  clients, inventory, expenses, inventoryPriceHistory, personalCollectionWatches, personalCollectionValuations, settings, retentionAudit, transactionParties, dealerNotebookEntries,
  users,
  type Client, type InsertClient, type UpdateClientRequest,
  type InventoryItem, type InsertInventory, type UpdateInventoryRequest, type InventoryPriceHistory,
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
import { requireOwnerId } from "./tenant";
import { retentionKey } from "@shared/retention";
import { DEFAULT_WARRANTY_MONTHS, normalizeWarrantyMonths } from "@shared/warranty";
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
type AccountExecutor = ExpenseExecutor & Pick<Parameters<Parameters<typeof db.transaction>[0]>[0], "execute">;

async function resolveSaleBuyer(connection: BuyerExecutor, buyer: SaleBuyerInput, currentBuyerId?: number | null) {
  const ownerId = requireOwnerId();
  if (buyer.mode === "none") return { buyerId: null, soldTo: null };
  if (buyer.mode === "existing") {
    const [client] = await connection.select().from(clients).where(and(
      eq(clients.ownerId, ownerId),
      eq(clients.id, buyer.clientId),
    ));
    if (!client) throw new SaleBuyerSaveError("This client no longer exists. Choose another client.", 400);
    return { buyerId: client.id, soldTo: client.name };
  }
  // Share the lock across creation and edits; names alone are never a match.
  await connection.execute(sql`select pg_advisory_xact_lock(73284077)`);
  const contacts = await connection.select().from(clients).where(eq(clients.ownerId, ownerId));
  const current = contacts.find(client => client.id === currentBuyerId);
  if (current && sameBuyerContact(current, buyer)) return { buyerId: current.id, soldTo: current.name };
  if (contacts.some(client => matchingBuyerContact(client, buyer))) {
    throw new SaleBuyerSaveError("A client with this email or phone already exists. Choose them using Existing client.", 409);
  }
  await assertFreePlanClientCapacity(connection, ownerId);
  const [client] = await connection.insert(clients).values({
    ownerId,
    name: buyer.name, email: buyer.email || null, phone: buyer.phone || null,
    country: buyer.country || null, type: "client",
  }).returning();
  return { buyerId: client.id, soldTo: client.name };
}

async function assertFreePlanClientCapacity(connection: AccountExecutor, ownerId: string): Promise<void> {
  await connection.execute(sql`select pg_advisory_xact_lock(hashtext(${ownerId}), 73284089)`);
  const [account] = await connection.select({
    accountRole: users.accountRole,
    subscriptionStatus: users.subscriptionStatus,
  }).from(users).where(eq(users.id, ownerId));
  if (!account) throw new SaleBuyerSaveError("Workspace not found.", 404);
  if (account.accountRole === "owner" || ["active", "trialing"].includes(account.subscriptionStatus)) return;
  const existingClients = await connection.select({ id: clients.id }).from(clients)
    .where(eq(clients.ownerId, ownerId)).limit(25);
  if (existingClients.length >= 25) {
    throw new SaleBuyerSaveError("The Free plan includes up to 25 clients. Upgrade to add another client.", 402);
  }
}

async function assertFreePlanInventoryCapacity(connection: AccountExecutor, ownerId: string): Promise<void> {
  await connection.execute(sql`select pg_advisory_xact_lock(hashtext(${ownerId}), 73284090)`);
  const [account] = await connection.select({
    accountRole: users.accountRole,
    subscriptionStatus: users.subscriptionStatus,
  }).from(users).where(eq(users.id, ownerId));
  if (!account) throw new SaleBuyerSaveError("Workspace not found.", 404);
  if (account.accountRole === "owner" || ["active", "trialing"].includes(account.subscriptionStatus)) return;
  const activeWatches = await connection.select({ id: inventory.id }).from(inventory).where(and(
    eq(inventory.ownerId, ownerId),
    isNull(inventory.archivedAt),
    ne(inventory.status, "sold"),
  )).limit(10);
  if (activeWatches.length >= 10) {
    throw new SaleBuyerSaveError("The Free plan includes up to 10 active watches. Upgrade to add another watch.", 402);
  }
}

async function assertOwnerClients(
  connection: ExpenseExecutor,
  ownerId: string,
  clientIds: Array<number | null | undefined>,
): Promise<void> {
  const requested = Array.from(new Set(clientIds.filter((id): id is number => Number.isInteger(id))));
  if (!requested.length) return;
  const matches = await connection.select({ id: clients.id }).from(clients).where(and(
    eq(clients.ownerId, ownerId),
    inArray(clients.id, requested),
  ));
  if (matches.length !== requested.length) {
    throw new SaleBuyerSaveError("Choose clients from your own workspace.", 400);
  }
}

function assertCurrentOwner(ownerId: string): string {
  const currentOwnerId = requireOwnerId();
  if (currentOwnerId !== ownerId) {
    throw new Error("Workspace data access requires the authenticated owner.");
  }
  return currentOwnerId;
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
  getAccountIds(): Promise<string[]>;
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

  async getAccountIds(): Promise<string[]> {
    const rows = await db.select({ id: users.id }).from(users);
    return rows.map((row) => row.id);
  }

  async getWorkspaceAccess() {
    const ownerId = requireOwnerId();
    const [account] = await db.select({
      accountRole: users.accountRole,
      subscriptionStatus: users.subscriptionStatus,
    }).from(users).where(eq(users.id, ownerId));
    if (!account) throw new Error("Workspace not found.");
    const activeWatches = await db.select({ id: inventory.id }).from(inventory).where(and(
      eq(inventory.ownerId, ownerId),
      isNull(inventory.archivedAt),
      ne(inventory.status, "sold"),
    ));
    const clientsList = await db.select({ id: clients.id }).from(clients).where(eq(clients.ownerId, ownerId));
    const isPro = account.accountRole === "owner" ||
      ["active", "trialing"].includes(account.subscriptionStatus);
    return {
      isPro,
      plan: isPro ? "pro" as const : "free" as const,
      activeWatchCount: activeWatches.length,
      clientCount: clientsList.length,
      limits: isPro ? null : { activeWatches: 10, clients: 25 },
      aiEnabled: isPro,
    };
  }

  async getNotebookInventoryData(): Promise<NotebookWatchInput[]> {
    const ownerId = requireOwnerId();
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
    }).from(inventory).where(eq(inventory.ownerId, ownerId));
  }

  async getNotebookPriceHistory(inventoryIds: number[]): Promise<NotebookPriceInput[]> {
    const ownerId = requireOwnerId();
    if (!inventoryIds.length) return [];
    return db.select({
      inventoryId: inventoryPriceHistory.inventoryId,
      listPrice: inventoryPriceHistory.listPrice,
      recordedAt: inventoryPriceHistory.recordedAt,
    }).from(inventoryPriceHistory)
      .where(and(
        eq(inventoryPriceHistory.ownerId, ownerId),
        inArray(inventoryPriceHistory.inventoryId, inventoryIds),
      ));
  }

  async getDealerNotebookEntry(monthKey: string): Promise<DealerNotebookEntry | undefined> {
    const ownerId = requireOwnerId();
    const [entry] = await db.select().from(dealerNotebookEntries)
      .where(and(
        eq(dealerNotebookEntries.ownerId, ownerId),
        eq(dealerNotebookEntries.monthKey, monthKey),
      ));
    return entry;
  }

  async captureDealerNotebookInventorySnapshot(monthKey: string): Promise<NotebookInventorySnapshot> {
    const ownerId = requireOwnerId();
    return db.transaction(async (tx) => {
      // A single shared lock serializes manual/automatic captures across instances.
      await tx.execute(sql`select pg_advisory_xact_lock(73284078)`);
      const [existing] = await tx.select().from(dealerNotebookEntries)
        .where(and(
          eq(dealerNotebookEntries.ownerId, ownerId),
          eq(dealerNotebookEntries.monthKey, monthKey),
        ));
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
      const records = await tx.select().from(inventory).where(eq(inventory.ownerId, ownerId));
      const [feeSetting] = await tx.select().from(settings)
        .where(and(eq(settings.ownerId, ownerId), eq(settings.key, "watch_register_fee")));
      const fee = Number(feeSetting?.value ?? 600);
      const snapshot = notebookInventorySnapshotSchema.parse(calculateNotebookInventorySnapshot(
        records,
        monthKey,
        Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : 600,
        now,
      ));
      await tx.insert(dealerNotebookEntries)
        .values({ ownerId, monthKey, inventorySnapshot: snapshot })
        .onConflictDoUpdate({
          target: [dealerNotebookEntries.ownerId, dealerNotebookEntries.monthKey],
          set: { inventorySnapshot: snapshot },
          setWhere: isNull(dealerNotebookEntries.inventorySnapshot),
        });
      const [saved] = await tx.select().from(dealerNotebookEntries)
        .where(and(
          eq(dealerNotebookEntries.ownerId, ownerId),
          eq(dealerNotebookEntries.monthKey, monthKey),
        ));
      return notebookInventorySnapshotSchema.parse(saved.inventorySnapshot);
    });
  }

  async saveDealerNotebookContext(monthKey: string, contextNote: string): Promise<DealerNotebookEntry> {
    const ownerId = requireOwnerId();
    const [entry] = await db.insert(dealerNotebookEntries)
      .values({ ownerId, monthKey, contextNote })
      .onConflictDoUpdate({
        target: [dealerNotebookEntries.ownerId, dealerNotebookEntries.monthKey],
        set: { contextNote, updatedAt: new Date() },
      })
      .returning();
    return entry;
  }

  async saveDealerNotebookActions(monthKey: string, actions: NotebookAction[]): Promise<DealerNotebookEntry> {
    const ownerId = requireOwnerId();
    const [entry] = await db.insert(dealerNotebookEntries)
      .values({ ownerId, monthKey, actions })
      .onConflictDoUpdate({
        target: [dealerNotebookEntries.ownerId, dealerNotebookEntries.monthKey],
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
    const ownerId = requireOwnerId();
    const [entry] = await db.insert(dealerNotebookEntries)
      .values({ ownerId, monthKey, comparisonMode, contextNote, report, actions, generatedAt: new Date() })
      .onConflictDoUpdate({
        target: [dealerNotebookEntries.ownerId, dealerNotebookEntries.monthKey],
        set: { comparisonMode, contextNote, report, actions, generatedAt: new Date(), updatedAt: new Date() },
      })
      .returning();
    return entry;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    const ownerId = requireOwnerId();
    return await db.select().from(clients).where(eq(clients.ownerId, ownerId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const ownerId = requireOwnerId();
    const [client] = await db.select().from(clients).where(and(eq(clients.ownerId, ownerId), eq(clients.id, id)));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const ownerId = requireOwnerId();
    return db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
      await assertFreePlanClientCapacity(tx, ownerId);
      const [client] = await tx.insert(clients).values({ ...insertClient, ownerId }).returning();
      return client;
    });
  }

  async updateClient(id: number, updates: UpdateClientRequest): Promise<Client> {
    const ownerId = requireOwnerId();
    return db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
      const [client] = await tx.update(clients).set({
        ...updates, profileUpdatedAt: new Date(), profileClearedAt: null,
      }).where(and(eq(clients.ownerId, ownerId), eq(clients.id, id))).returning();
      if (!client) throw new RetentionError("Client not found.", 404);
      return client;
    });
  }

  async deleteClient(id: number): Promise<void> {
    const ownerId = requireOwnerId();
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(73284077)`);
      const [client] = await tx.select({ id: clients.id }).from(clients).where(and(
        eq(clients.ownerId, ownerId),
        eq(clients.id, id),
      ));
      if (!client) throw new RetentionError("Client not found.", 404);

      // Preserve watches and transaction details; only clear their links to this profile.
      await tx.update(inventory).set({ clientId: null }).where(and(eq(inventory.ownerId, ownerId), eq(inventory.clientId, id)));
      await tx.update(inventory).set({ buyerId: null }).where(and(eq(inventory.ownerId, ownerId), eq(inventory.buyerId, id)));
      await tx.delete(clients).where(and(eq(clients.ownerId, ownerId), eq(clients.id, id)));
    });
  }

  // Inventory
  async findInventorySerialMatches(serials: unknown[], excludeId?: number) {
    const ownerId = requireOwnerId();
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
      excludeId == null
        ? and(eq(inventory.ownerId, ownerId), serialCondition)
        : and(eq(inventory.ownerId, ownerId), serialCondition, ne(inventory.id, excludeId)),
    ).orderBy(desc(inventory.purchaseDate));

    return matches.map((watch) => ({
      ...watch,
      matchedFields: getMatchingSerialFields(watch, serials),
    }));
  }

  async getInventoryItems(status?: string, includeArchived = false): Promise<(InventoryItem & { seller?: Client })[]> {
    const ownerId = requireOwnerId();
    const conditions = [eq(inventory.ownerId, ownerId)];
    if (status) conditions.push(eq(inventory.status, status as any));
    if (!includeArchived) conditions.push(isNull(inventory.archivedAt));

    const query = db.select({ item: inventory, seller: clients })
      .from(inventory)
      .leftJoin(clients, and(
        eq(inventory.ownerId, clients.ownerId),
        eq(inventory.clientId, clients.id),
      ));
    const rows = await query
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(inventory.purchaseDate));

    return rows.map(({ item, seller }) => ({ ...item, seller: seller ?? undefined }));
  }

  async getArchivedInventoryItems(): Promise<(InventoryItem & { seller?: Client })[]> {
    const ownerId = requireOwnerId();
    const rows = await db.select({ item: inventory, seller: clients })
      .from(inventory)
      .leftJoin(clients, and(
        eq(inventory.ownerId, clients.ownerId),
        eq(inventory.clientId, clients.id),
      ))
      .where(and(eq(inventory.ownerId, ownerId), isNotNull(inventory.archivedAt)))
      .orderBy(desc(inventory.archivedAt));
    return rows.map(({ item, seller }) => ({ ...item, seller: seller ?? undefined }));
  }

  private async setInventoryArchived(id: number, archived: boolean): Promise<InventoryItem> {
    const ownerId = requireOwnerId();
    return db.transaction(async tx => {
      const [current] = await tx.select().from(inventory).where(and(
        eq(inventory.ownerId, ownerId),
        eq(inventory.id, id),
      ));
      if (!current) throw new Error("Item not found");

      const currentlyArchived = current.archivedAt != null;
      if (currentlyArchived === archived) return current;
      if (!archived && current.status !== "sold") {
        await assertFreePlanInventoryCapacity(tx, ownerId);
      }

      const [updated] = await tx.update(inventory)
        .set({ archivedAt: archived ? new Date() : null })
        .where(and(eq(inventory.ownerId, ownerId), eq(inventory.id, id)))
        .returning();
      if (!updated) throw new Error("Item not found");

      await tx.insert(retentionAudit).values({
        ownerId,
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
    const ownerId = requireOwnerId();
    const [item] = await db.select().from(inventory).where(and(
      eq(inventory.ownerId, ownerId),
      eq(inventory.id, id),
    ));
    if (!item) return undefined;

    const itemExpenses = await db.select().from(expenses).where(and(
      eq(expenses.ownerId, ownerId),
      eq(expenses.inventoryId, id),
    ));
    return { ...item, expenses: itemExpenses };
  }

  async getInventoryPriceHistory(id: number): Promise<InventoryPriceHistory[]> {
    const ownerId = requireOwnerId();
    return db.select().from(inventoryPriceHistory)
      .where(and(
        eq(inventoryPriceHistory.ownerId, ownerId),
        eq(inventoryPriceHistory.inventoryId, id),
      ))
      .orderBy(desc(inventoryPriceHistory.recordedAt), desc(inventoryPriceHistory.id));
  }

  async updateInventoryPriceHistory(inventoryId: number, historyId: number, listPrice: number): Promise<InventoryPriceHistory | undefined> {
    const ownerId = requireOwnerId();
    const [entry] = await db.update(inventoryPriceHistory)
      .set({ listPrice })
      .where(and(
        eq(inventoryPriceHistory.ownerId, ownerId),
        eq(inventoryPriceHistory.id, historyId),
        eq(inventoryPriceHistory.inventoryId, inventoryId),
      ))
      .returning();
    return entry;
  }

  async createInventoryItem(insertItem: InsertInventory, saleBuyer?: SaleBuyerInput): Promise<InventoryItem> {
    const ownerId = requireOwnerId();
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
      if (itemWithSnapshot.status !== "sold") {
        await assertFreePlanInventoryCapacity(tx, ownerId);
      }
      const buyer = saleBuyer ? await resolveSaleBuyer(tx, saleBuyer) : {};
      const itemInput = { ...itemWithSnapshot, ...buyer, ownerId };
      await assertOwnerClients(tx, ownerId, [itemInput.clientId, itemInput.buyerId]);
      const [item] = await tx.insert(inventory).values(itemInput).returning();
      if (shouldRecordListedPrice(null, item.listPrice)) {
        await tx.insert(inventoryPriceHistory).values({ ownerId, inventoryId: item.id, listPrice: item.listPrice! });
      }
      await this.syncWatchFeesToExpenses(item, tx);
      return item;
    });
  }

  async updateInventoryItem(id: number, updates: UpdateInventoryRequest, saleBuyer?: SaleBuyerInput): Promise<InventoryItem> {
    const ownerId = requireOwnerId();
    const normalizedUpdates = normalizeSoldDateFields(updates);
    // Delivery-only confirmation never rewrites or corrects financial records.
    if (!saleBuyer && Object.keys(updates).every(key => key === "deliveredDate")) {
      const [item] = await db.update(inventory).set(normalizedUpdates).where(and(
        eq(inventory.ownerId, ownerId),
        eq(inventory.id, id),
      )).returning();
      if (!item) throw new Error("Item not found");
      return item;
    }
    return db.transaction(async tx => {
      // Serialize fee corrections as well as buyer changes. Watch and expense
      // totals commit together; retries cannot append duplicate corrections.
      const [current] = await tx.select().from(inventory).where(and(
        eq(inventory.ownerId, ownerId),
        eq(inventory.id, id),
      )).for("update");
      if (!current) throw new SaleBuyerSaveError("Watch not found.", 404);
      if (!current.archivedAt && current.status === "sold" &&
          normalizedUpdates.status != null && normalizedUpdates.status !== "sold") {
        await assertFreePlanInventoryCapacity(tx, ownerId);
      }
      const buyer = saleBuyer ? await resolveSaleBuyer(tx, saleBuyer, current.buyerId) : {};
      const resolvedBuyerId = "buyerId" in buyer
        ? (buyer as { buyerId: number | null }).buyerId
        : "buyerId" in updates ? updates.buyerId : current.buyerId;
      await assertOwnerClients(tx, ownerId, [
        "clientId" in updates ? updates.clientId : current.clientId,
        resolvedBuyerId,
      ]);
      const certificationDateUpdate = "chrono24CertificationSent" in normalizedUpdates
        ? {
            chrono24CertificationSentAt: normalizedUpdates.chrono24CertificationSent
              ? (current.chrono24CertificationSent ? current.chrono24CertificationSentAt : new Date())
              : null,
          }
        : {};
      const [item] = await tx.update(inventory).set({ ...normalizedUpdates, ...certificationDateUpdate, ...buyer })
        .where(and(eq(inventory.ownerId, ownerId), eq(inventory.id, id))).returning();
      if (shouldRecordListedPrice(current.listPrice, updates.listPrice)) {
        await tx.insert(inventoryPriceHistory).values({ ownerId, inventoryId: id, listPrice: updates.listPrice! });
      }
      await this.syncWatchFeesToExpenses(item, tx);
      return item;
    });
  }

  async updateMovementSpecs(id: number, specs: Record<string, string>): Promise<InventoryItem> {
    const ownerId = requireOwnerId();
    const [item] = await db.update(inventory).set({ movementSpecs: specs })
      .where(and(eq(inventory.ownerId, ownerId), eq(inventory.id, id))).returning();
    if (!item) throw new Error("Item not found");
    return item;
  }

  async updateCreditInfo(id: number, updates: { creditPaid?: boolean; creditDueDate?: string | null; creditNotes?: string | null }): Promise<InventoryItem> {
    const ownerId = requireOwnerId();
    const payload: Record<string, any> = {};
    if (updates.creditPaid !== undefined) payload.creditPaid = updates.creditPaid;
    if ("creditDueDate" in updates) payload.creditDueDate = updates.creditDueDate ? new Date(updates.creditDueDate) : null;
    if ("creditNotes" in updates) payload.creditNotes = updates.creditNotes ?? null;
    const [item] = await db.update(inventory).set(payload)
      .where(and(eq(inventory.ownerId, ownerId), eq(inventory.id, id))).returning();
    if (!item) throw new Error("Item not found");
    return item;
  }

  // Sync watch fees to expense entries
  private async syncWatchFeesToExpenses(item: InventoryItem, connection: ExpenseExecutor = db): Promise<void> {
    const ownerId = requireOwnerId();
    const watchRef = `${item.brand} ${item.model} - Ref#${item.referenceNumber}`;
    const feeDate = item.purchaseDate || new Date();
    // Use per-item snapshot if available, otherwise fall back to current setting
    const [feeSetting] = item.watchRegisterFeeSnapshot == null
      ? await connection.select().from(settings).where(and(
          eq(settings.ownerId, ownerId),
          eq(settings.key, "watch_register_fee"),
        ))
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
          eq(expenses.ownerId, ownerId),
          eq(expenses.inventoryId, item.id),
          sql`${expenses.description} LIKE ${`${feeType.label}%`}`
        ));

      // Preserve originals, including their amounts and dates. An append-only
      // correction brings the sum to the current fee, even when it becomes zero.
      const recordedTotal = existingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const correction = feeValue - recordedTotal;
      if (correction !== 0) {
        await connection.insert(expenses).values({
          ownerId,
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
    const ownerId = requireOwnerId();
    await db.transaction(async tx => {
      const [watch] = await tx.select({ id: inventory.id }).from(inventory).where(and(
        eq(inventory.ownerId, ownerId),
        eq(inventory.id, id),
      ));
      if (!watch) throw new RetentionError("Watch not found.", 404);

      // Keep linked records, but clear their pointer to the deleted watch.
      await tx.update(expenses).set({ inventoryId: null }).where(and(eq(expenses.ownerId, ownerId), eq(expenses.inventoryId, id)));
      await tx.update(transactionParties).set({ inventoryId: null }).where(and(eq(transactionParties.ownerId, ownerId), eq(transactionParties.inventoryId, id)));
      await tx.update(inventoryPriceHistory).set({ inventoryId: null }).where(and(eq(inventoryPriceHistory.ownerId, ownerId), eq(inventoryPriceHistory.inventoryId, id)));
      await tx.delete(inventory).where(and(eq(inventory.ownerId, ownerId), eq(inventory.id, id)));
    });
  }

  async getPersonalCollectionWatches(ownerId: string): Promise<PersonalCollectionWatch[]> {
    assertCurrentOwner(ownerId);
    return db.select().from(personalCollectionWatches)
      .where(eq(personalCollectionWatches.ownerId, ownerId))
      .orderBy(desc(personalCollectionWatches.dateBought), desc(personalCollectionWatches.createdAt));
  }

  async getPersonalCollectionWatch(ownerId: string, id: number): Promise<PersonalCollectionWatch | undefined> {
    assertCurrentOwner(ownerId);
    const [watch] = await db.select().from(personalCollectionWatches).where(and(
      eq(personalCollectionWatches.ownerId, ownerId),
      eq(personalCollectionWatches.id, id),
    ));
    return watch;
  }

  async getPersonalCollectionValuations(ownerId: string, watchId: number): Promise<PersonalCollectionValuation[] | undefined> {
    assertCurrentOwner(ownerId);
    const watch = await this.getPersonalCollectionWatch(ownerId, watchId);
    if (!watch) return undefined;
    return db.select().from(personalCollectionValuations)
      .where(and(
        eq(personalCollectionValuations.ownerId, ownerId),
        eq(personalCollectionValuations.watchId, watchId),
      ))
      .orderBy(
        desc(personalCollectionValuations.valuationDate),
        desc(personalCollectionValuations.createdAt),
        desc(personalCollectionValuations.id),
      );
  }

  private async getLatestPersonalCollectionEstimate(
    connection: Pick<typeof db, "select">,
    ownerId: string,
    watchId: number,
  ): Promise<{ hasEntry: boolean; estimatedValue: number | null }> {
    const [latest] = await connection.select({ estimatedValue: personalCollectionValuations.estimatedValue })
      .from(personalCollectionValuations)
      .where(and(
        eq(personalCollectionValuations.ownerId, ownerId),
        eq(personalCollectionValuations.watchId, watchId),
      ))
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
    ownerId: string,
    watchId: number,
  ): Promise<number | null> {
    const { estimatedValue } = await this.getLatestPersonalCollectionEstimate(connection, ownerId, watchId);
    await connection.update(personalCollectionWatches)
      .set({ estimatedValue, updatedAt: new Date() })
      .where(and(eq(personalCollectionWatches.ownerId, ownerId), eq(personalCollectionWatches.id, watchId)));
    return estimatedValue;
  }

  async createPersonalCollectionValuation(
    ownerId: string,
    watchId: number,
    valuation: Pick<InsertPersonalCollectionValuation, "valuationDate" | "estimatedValue">,
  ): Promise<PersonalCollectionValuation | undefined> {
    assertCurrentOwner(ownerId);
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
        .values({ ...valuation, ownerId, watchId })
        .returning();
      await this.syncPersonalCollectionLatestEstimate(tx, ownerId, watchId);
      return created;
    });
  }

  async updatePersonalCollectionValuation(
    ownerId: string,
    watchId: number,
    valuationId: number,
    valuation: Pick<InsertPersonalCollectionValuation, "valuationDate" | "estimatedValue">,
  ): Promise<PersonalCollectionValuation | undefined> {
    assertCurrentOwner(ownerId);
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
          eq(personalCollectionValuations.ownerId, ownerId),
          eq(personalCollectionValuations.watchId, watchId),
          eq(personalCollectionValuations.id, valuationId),
        ))
        .returning();
      if (!updated) return undefined;
      await this.syncPersonalCollectionLatestEstimate(tx, ownerId, watchId);
      return updated;
    });
  }

  async createPersonalCollectionWatch(ownerId: string, item: InsertPersonalCollectionWatch): Promise<PersonalCollectionWatch> {
    assertCurrentOwner(ownerId);
    const [watch] = await db.insert(personalCollectionWatches).values({ ...item, ownerId }).returning();
    return watch;
  }

  async updatePersonalCollectionWatch(
    ownerId: string,
    id: number,
    updates: Partial<InsertPersonalCollectionWatch>,
  ): Promise<PersonalCollectionWatch | undefined> {
    assertCurrentOwner(ownerId);
    return db.transaction(async (tx) => {
      const [current] = await tx.select({ id: personalCollectionWatches.id })
        .from(personalCollectionWatches)
        .where(and(
          eq(personalCollectionWatches.ownerId, ownerId),
          eq(personalCollectionWatches.id, id),
        ))
        .for("update");
      if (!current) return undefined;

      const latestEstimate = await this.getLatestPersonalCollectionEstimate(tx, ownerId, id);
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
    assertCurrentOwner(ownerId);
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
    const ownerId = requireOwnerId();
    const rows = await db.select({ expense: expenses, inventory: inventory })
      .from(expenses)
      .leftJoin(inventory, and(
        eq(expenses.ownerId, inventory.ownerId),
        eq(expenses.inventoryId, inventory.id),
      ))
      .where(eq(expenses.ownerId, ownerId))
      .orderBy(desc(expenses.date));
    return rows.map(({ expense, inventory: linkedInventory }) => ({
      ...expense,
      inventory: linkedInventory ?? undefined,
    }));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const ownerId = requireOwnerId();
    const [expense] = await db.select().from(expenses).where(and(
      eq(expenses.ownerId, ownerId),
      eq(expenses.id, id),
    ));
    return expense;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const ownerId = requireOwnerId();
    if (insertExpense.inventoryId != null) {
      const [watch] = await db.select({ id: inventory.id }).from(inventory).where(and(
        eq(inventory.ownerId, ownerId),
        eq(inventory.id, insertExpense.inventoryId),
      ));
      if (!watch) throw new RetentionError("Watch not found in this workspace.", 404);
    }
    const [expense] = await db.insert(expenses).values({ ...insertExpense, ownerId }).returning();
    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense> {
    const ownerId = requireOwnerId();
    const original = await this.getExpense(id);
    if (!original) throw new Error("Expense not found");
    if (updates.inventoryId != null) {
      const [watch] = await db.select({ id: inventory.id }).from(inventory).where(and(
        eq(inventory.ownerId, ownerId),
        eq(inventory.id, updates.inventoryId),
      ));
      if (!watch) throw new RetentionError("Watch not found in this workspace.", 404);
    }
    if (original.inventoryId && FEE_TYPES.some(fee => original.description.startsWith(fee.label))) {
      throw new RetentionError("Watch-fee expense history is protected. Correct the fee on the watch to record an adjustment without changing the original expense.");
    }
    const [expense] = await db.update(expenses).set(updates).where(and(
      eq(expenses.ownerId, ownerId),
      eq(expenses.id, id),
    )).returning();
    if (!expense) {
      throw new Error("Expense not found");
    }
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    const ownerId = requireOwnerId();
    const [deleted] = await db.delete(expenses).where(and(
      eq(expenses.ownerId, ownerId),
      eq(expenses.id, id),
    )).returning({ id: expenses.id });
    if (!deleted) throw new Error("Expense not found");
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const ownerId = requireOwnerId();
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
    }).from(inventory).where(eq(inventory.ownerId, ownerId));
    
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
    const ownerId = requireOwnerId();
    const rows = await db.select().from(settings).where(eq(settings.ownerId, ownerId));
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async getSetting(key: string): Promise<any> {
    const ownerId = requireOwnerId();
    const [row] = await db.select().from(settings).where(and(
      eq(settings.ownerId, ownerId),
      eq(settings.key, key),
    ));
    return row?.value ?? null;
  }

  async upsertSetting(key: string, value: any): Promise<Setting> {
    const ownerId = requireOwnerId();
    if (key === retentionKey) throw new RetentionError("Use the dedicated retention schedule approval controls.");
    const [result] = await db
      .insert(settings)
      .values({ ownerId, key, value })
      .onConflictDoUpdate({
        target: [settings.ownerId, settings.key],
        set: { value },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
