import { db } from "./db";
import {
  clients, inventory, expenses, settings, retentionHolds, retentionAudit, transactionParties,
  type Client, type InsertClient, type UpdateClientRequest,
  type InventoryItem, type InsertInventory, type UpdateInventoryRequest,
  type Expense, type InsertExpense,
  type DashboardStats, type Setting
} from "@shared/schema";
import { eq, desc, sql, and, isNull } from "drizzle-orm";
import { matchingBuyerContact, sameBuyerContact, type SaleBuyerInput } from "@shared/sale-buyer";
import { RetentionError } from "./retention";
import { retentionKey } from "@shared/retention";

export class SaleBuyerSaveError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

type ExpenseExecutor = Pick<typeof db, "select" | "insert" | "update" | "delete">;
type BuyerExecutor = ExpenseExecutor & Pick<Parameters<Parameters<typeof db.transaction>[0]>[0], "execute">;

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

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: UpdateClientRequest): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Inventory
  getInventoryItems(status?: string): Promise<(InventoryItem & { seller?: Client })[]>;
  getInventoryItem(id: number): Promise<(InventoryItem & { expenses?: Expense[] }) | undefined>;
  createInventoryItem(item: InsertInventory, saleBuyer?: SaleBuyerInput): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: UpdateInventoryRequest, saleBuyer?: SaleBuyerInput): Promise<InventoryItem>;
  updateMovementSpecs(id: number, specs: Record<string, string>): Promise<InventoryItem>;
  updateCreditInfo(id: number, updates: { creditPaid?: boolean; creditDueDate?: string | null; creditNotes?: string | null }): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;

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
}

export class DatabaseStorage implements IStorage {
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
    throw new RetentionError("Client deletion is protected. Use the retention preview to clear optional profile details while preserving required transaction records.");
  }

  // Inventory
  async getInventoryItems(status?: string): Promise<(InventoryItem & { seller?: Client })[]> {
    // Simpler query - get all inventory first
    let items: InventoryItem[];
    
    if (status) {
      items = await db.select().from(inventory).where(eq(inventory.status, status as any)).orderBy(desc(inventory.purchaseDate));
    } else {
      items = await db.select().from(inventory).orderBy(desc(inventory.purchaseDate));
    }

    // Fetch sellers for items that have clientId
    const result: (InventoryItem & { seller?: Client })[] = [];
    for (const item of items) {
      let seller: Client | undefined;
      if (item.clientId) {
        seller = await this.getClient(item.clientId);
      }
      result.push({ ...item, seller });
    }
    return result;
  }

  async getInventoryItem(id: number): Promise<(InventoryItem & { expenses?: Expense[] }) | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    if (!item) return undefined;

    const itemExpenses = await db.select().from(expenses).where(eq(expenses.inventoryId, id));
    return { ...item, expenses: itemExpenses };
  }

  async createInventoryItem(insertItem: InsertInventory, saleBuyer?: SaleBuyerInput): Promise<InventoryItem> {
    // Snapshot the current watch_register_fee so future admin-panel changes
    // don't retroactively affect this item's cost calculations.
    const currentFee = await this.getSetting("watch_register_fee") || 600;
    const itemWithSnapshot = { ...insertItem, watchRegisterFeeSnapshot: currentFee };
    return db.transaction(async tx => {
      const buyer = saleBuyer ? await resolveSaleBuyer(tx, saleBuyer) : {};
      const [item] = await tx.insert(inventory).values({ ...itemWithSnapshot, ...buyer }).returning();
      await this.syncWatchFeesToExpenses(item, tx);
      return item;
    });
  }

  async updateInventoryItem(id: number, updates: UpdateInventoryRequest, saleBuyer?: SaleBuyerInput): Promise<InventoryItem> {
    // Delivery-only confirmation never rewrites or corrects financial records.
    if (!saleBuyer && Object.keys(updates).every(key => key === "deliveredDate")) {
      const [item] = await db.update(inventory).set(updates).where(eq(inventory.id, id)).returning();
      if (!item) throw new Error("Item not found");
      return item;
    }
    return db.transaction(async tx => {
      // Serialize fee corrections as well as buyer changes. Watch and expense
      // totals commit together; retries cannot append duplicate corrections.
      const [current] = await tx.select().from(inventory).where(eq(inventory.id, id)).for("update");
      if (!current) throw new SaleBuyerSaveError("Watch not found.", 404);
      const buyer = saleBuyer ? await resolveSaleBuyer(tx, saleBuyer, current.buyerId) : {};
      const [item] = await tx.update(inventory).set({ ...updates, ...buyer })
        .where(eq(inventory.id, id)).returning();
      await this.syncWatchFeesToExpenses(item, tx);
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
      // Serialize watch deletion with hold creation/release so an active hold
      // cannot be added between the check and the delete.
      await tx.execute(sql`select pg_advisory_xact_lock(73284088)`);
      const [watch] = await tx.select({ id: inventory.id }).from(inventory).where(eq(inventory.id, id));
      if (!watch) throw new RetentionError("Watch not found.", 404);

      const [activeHold] = await tx.select({ id: retentionHolds.id }).from(retentionHolds).where(and(
        eq(retentionHolds.scope, "inventory"),
        eq(retentionHolds.recordId, id),
        isNull(retentionHolds.releasedAt),
      ));
      if (activeHold) {
        throw new RetentionError("This watch has an active retention hold and cannot be deleted. Release the hold first.");
      }

      // Keep financial and transaction evidence; only detach it from inventory.
      await tx.update(expenses).set({ inventoryId: null }).where(eq(expenses.inventoryId, id));
      await tx.update(transactionParties).set({ inventoryId: null }).where(eq(transactionParties.inventoryId, id));
      await tx.delete(inventory).where(eq(inventory.id, id));
      await tx.insert(retentionAudit).values({ action: "watch_deleted_records_retained", recordId: id });
    });
  }

  // Expenses
  async getExpenses(): Promise<(Expense & { inventory?: InventoryItem })[]> {
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.date));
    
    // Fetch inventory for expenses that have inventoryId
    const result: (Expense & { inventory?: InventoryItem })[] = [];
    for (const expense of allExpenses) {
      let linkedInventory: InventoryItem | undefined;
      if (expense.inventoryId) {
        const [item] = await db.select().from(inventory).where(eq(inventory.id, expense.inventoryId));
        linkedInventory = item;
      }
      result.push({ ...expense, inventory: linkedInventory });
    }
    return result;
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
    throw new RetentionError("Financial expense records are protected from deletion. Retention expiry requires a separate transaction-record review.");
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const currentWrFee = await this.getSetting("watch_register_fee") || 600;
    const allInventory = await db.select().from(inventory);
    
    const activeInventory = allInventory.filter(i => i.status !== 'sold');
    const soldInventory = allInventory.filter(i => i.status === 'sold');
    
    const totalInventoryValue = activeInventory.reduce((sum, item) => {
      const basePrice = item.purchasePrice || 0;
      const wrFee = (item as any).watchRegisterFeeSnapshot ?? currentWrFee;
      const watchRegisterFee = item.watchRegister ? wrFee : 0;
      return sum + basePrice + watchRegisterFee;
    }, 0);
    
    const totalProfit = soldInventory.reduce((sum, item) => {
      const sold = item.salePrice || 0;
      if (sold === 0) return sum;

      const bought = item.purchasePrice || 0;
      const importFee = item.importFee || 0;
      const serviceFee = (item as any).serviceFee || 0;
      const polishFee = (item as any).polishFee || 0;
      const wrFee = (item as any).watchRegisterFeeSnapshot ?? currentWrFee;
      const watchRegisterFee = item.watchRegister ? wrFee : 0;
      const platformFees = item.platformFees || 0;
      const shippingFee = item.shippingFee || 0;
      const insuranceFee = item.insuranceFee || 0;

      const totalCosts = bought + importFee + serviceFee + polishFee + watchRegisterFee + platformFees + shippingFee + insuranceFee;
      return sum + (sold - totalCosts);
    }, 0);

    // Turn rate calculation (simplified: avg days held for sold items)
    let totalDays = 0;
    let soldCount = 0;
    
    soldInventory.forEach(item => {
      const purchaseDate = item.purchaseDate;
      const soldDate = item.dateSold || item.soldDate;

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
