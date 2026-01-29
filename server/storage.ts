import { db } from "./db";
import {
  clients, inventory, expenses,
  type Client, type InsertClient, type UpdateClientRequest,
  type InventoryItem, type InsertInventory, type UpdateInventoryRequest,
  type Expense, type InsertExpense,
  type DashboardStats
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: UpdateClientRequest): Promise<Client>;

  // Inventory
  getInventoryItems(status?: string): Promise<(InventoryItem & { seller?: Client })[]>;
  getInventoryItem(id: number): Promise<(InventoryItem & { expenses?: Expense[] }) | undefined>;
  createInventoryItem(item: InsertInventory): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: UpdateInventoryRequest): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
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
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, updates: UpdateClientRequest): Promise<Client> {
    const [client] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return client;
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

  async createInventoryItem(insertItem: InsertInventory): Promise<InventoryItem> {
    const [item] = await db.insert(inventory).values(insertItem).returning();
    return item;
  }

  async updateInventoryItem(id: number, updates: UpdateInventoryRequest): Promise<InventoryItem> {
    const [item] = await db.update(inventory).set(updates).where(eq(inventory.id, id)).returning();
    return item;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.inventoryId, id)); // Cascade delete expenses
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
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
    const [expense] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    if (!expense) {
      throw new Error("Expense not found");
    }
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const allInventory = await db.select().from(inventory);
    
    const activeInventory = allInventory.filter(i => i.status === 'in_stock' || i.status === 'servicing' || i.status === 'incoming');
    const soldInventory = allInventory.filter(i => i.status === 'sold' || i.dateSold !== null);
    
    const totalInventoryValue = activeInventory.reduce((sum, item) => {
      const basePrice = item.purchasePrice || 0;
      const watchRegisterFee = item.watchRegister ? 600 : 0;
      return sum + basePrice + watchRegisterFee;
    }, 0);
    
    const totalProfit = soldInventory.reduce((sum, item) => {
      const sold = item.salePrice || 0;
      const bought = item.purchasePrice || 0;
      const importFee = item.importFee || 0;
      const serviceFee = item.servicePolishFee || 0;
      const watchRegisterFee = item.watchRegister ? 600 : 0;
      const platformFees = item.platformFees || 0;
      const shippingFee = item.shippingFee || 0;
      const insuranceFee = item.insuranceFee || 0;

      const totalCosts = bought + importFee + serviceFee + watchRegisterFee + platformFees + shippingFee + insuranceFee;
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
}

export const storage = new DatabaseStorage();
