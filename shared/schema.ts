import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === CLIENTS ===
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  socialHandle: text("social_handle"),
  country: text("country"),
  type: text("type", { enum: ["client", "dealer"] }).default("client").notNull(),
  notes: text("notes"),
  isVip: boolean("is_vip").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

// === INVENTORY (Watches) ===
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  referenceNumber: text("reference_number").notNull(),
  serialNumber: text("serial_number"),
  internalSerial: text("internal_serial"),
  year: integer("year"),
  
  // Purchase Details
  purchasedFrom: text("purchased_from"),
  paidWith: text("paid_with"),
  purchasePrice: integer("purchase_price").notNull(),
  importFee: integer("import_fee").default(0),
  watchRegister: boolean("watch_register").default(false),
  
  // Service & Preparation Costs (stored in cents)
  serviceFee: integer("service_fee").default(0),
  polishFee: integer("polish_fee").default(0),
  
  // Sale Details (stored in cents)
  salePrice: integer("sale_price").default(0),
  soldTo: text("sold_to"),
  platformFees: integer("platform_fees").default(0),
  shippingFee: integer("shipping_fee").default(0),
  insuranceFee: integer("insurance_fee").default(0),
  
  // Legacy fields (keeping for compatibility)
  targetSellPrice: integer("target_sell_price").notNull(),
  soldPrice: integer("sold_price"),
  
  // Dates
  purchaseDate: timestamp("purchase_date"),
  dateListed: timestamp("date_listed"),
  soldDate: timestamp("sold_date"),
  dateSold: timestamp("date_sold"),
  
  // Details
  condition: text("condition", { enum: ["New", "Mint", "Used", "Damaged"] }).notNull(),
  status: text("status", { enum: ["in_stock", "sold", "incoming", "servicing", "received"] }).default("incoming").notNull(),
  box: boolean("box").default(false).notNull(),
  papers: boolean("papers").default(false).notNull(),
  images: text("images").array(),
  gdriveLink: text("gdrive_link"),
  notes: text("notes"),
  
  // Shipping & Tracking
  shippingPartner: text("shipping_partner"),
  trackingNumber: text("tracking_number"),
  soldPlatform: text("sold_platform"),
  
  // Relations
  clientId: integer("client_id").references(() => clients.id),
  buyerId: integer("buyer_id").references(() => clients.id),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true });
export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

// === EXPENSES ===
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").references(() => inventory.id),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // cents
  date: timestamp("date").defaultNow().notNull(),
  category: text("category", { enum: ["marketing", "rent_storage", "subscriptions", "tools", "insurance", "service", "shipping", "parts", "platform_fees", "other"] }).default("other").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// === RELATIONS ===
export const clientsRelations = relations(clients, ({ many }) => ({
  inventorySold: many(inventory, { relationName: "seller" }),
  inventoryBought: many(inventory, { relationName: "buyer" }),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  seller: one(clients, {
    fields: [inventory.clientId],
    references: [clients.id],
    relationName: "seller",
  }),
  buyer: one(clients, {
    fields: [inventory.buyerId],
    references: [clients.id],
    relationName: "buyer",
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  inventory: one(inventory, {
    fields: [expenses.inventoryId],
    references: [inventory.id],
  }),
}));

// === API TYPES ===
export type CreateClientRequest = InsertClient;
export type UpdateClientRequest = Partial<InsertClient>;

export type CreateInventoryRequest = InsertInventory;
export type UpdateInventoryRequest = Partial<InsertInventory>;

export type CreateExpenseRequest = InsertExpense;

// Dashboard Stats
export interface DashboardStats {
  totalInventoryValue: number;
  totalProfit: number;
  activeInventoryCount: number;
  soldInventoryCount: number;
  turnRate: number; // Avg days to sell
}
