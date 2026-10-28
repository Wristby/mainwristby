import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// Persistent security counters. No usernames, IP addresses or credentials.
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [index("login_attempts_expiry_idx").on(table.expiresAt)]);

// === SETTINGS ===
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export type Setting = typeof settings.$inferSelect;

// Holds apply to a profile or a watch (including its financial/expense records).
// recordId intentionally has no FK: a hold must never cascade away.
export const retentionHolds = pgTable("retention_holds", {
  id: serial("id").primaryKey(),
  scope: text("scope", { enum: ["client", "inventory"] }).notNull(),
  recordId: integer("record_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  releasedAt: timestamp("released_at"),
  releaseReason: text("release_reason"),
});

// An identity belongs to a transaction, not to its optional CRM profile.
// Populated on profile cleanup without copying contact details or CRM notes.
export const transactionParties = pgTable("transaction_parties", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").references(() => inventory.id),
  role: text("role", { enum: ["buyer", "seller"] }).notNull(),
  name: text("name").notNull(),
  retainedAt: timestamp("retained_at").defaultNow().notNull(),
});

// No names, contacts, hold reasons or approval references in the audit trail.
export const retentionAudit = pgTable("retention_audit", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  recordId: integer("record_id"),
  revision: text("revision"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Append-only evidence of the exact schedule in effect for each audit revision.
export const retentionPolicies = pgTable("retention_policies", {
  revision: text("revision").primaryKey(),
  schedule: jsonb("schedule").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === CLIENTS ===
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  socialHandle: text("social_handle"),
  website: text("website"),
  country: text("country"),
  type: text("type", { enum: ["client", "dealer"] }).default("client").notNull(),
  notes: text("notes"),
  isVip: boolean("is_vip").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  profileUpdatedAt: timestamp("profile_updated_at").defaultNow().notNull(),
  profileClearedAt: timestamp("profile_cleared_at"),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true, createdAt: true, profileUpdatedAt: true, profileClearedAt: true,
});
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
  serviceStartDate: timestamp("service_start_date"),
  dateSentToService: timestamp("date_sent_to_service"),
  dateReturnedFromService: timestamp("date_returned_from_service"),
  serviceNotes: text("service_notes"),
  
  // Sale Details (stored in cents)
  salePrice: integer("sale_price").default(0),
  soldTo: text("sold_to"),
  platformFees: integer("platform_fees").default(0),
  // Stored in hundredths of a percent: 650 represents a 6.50% Chrono24 fee.
  chrono24FeeRate: integer("chrono24_fee_rate"),
  shippingFee: integer("shipping_fee").default(0),
  insuranceFee: integer("insurance_fee").default(0),
  
  // Legacy fields (keeping for compatibility)
  targetSellPrice: integer("target_sell_price").notNull(),
  soldPrice: integer("sold_price"),
  
  // Dates
  dateReceived: timestamp("date_received"),
  purchaseDate: timestamp("purchase_date"),
  dateListed: timestamp("date_listed"),
  soldDate: timestamp("sold_date"),
  dateSold: timestamp("date_sold"),
  
  // Details
  // Keep legacy values for existing records and older forms while allowing the
  // clearer condition labels used by Watch Details.
  condition: text("condition", {
    enum: ["New", "Mint", "Used", "Damaged", "Good", "Very Good", "Excellent", "Like New"],
  }).notNull(),
  status: text("status", { enum: ["in_stock", "sold", "incoming", "servicing", "received"] }).default("incoming").notNull(),
  archivedAt: timestamp("archived_at"),
  box: boolean("box").default(false).notNull(),
  papers: boolean("papers").default(false).notNull(),
  images: text("images").array(),
  gdriveLink: text("gdrive_link"),
  notes: text("notes"),
  
  // Price Listed At (asking price when listed, stored in cents)
  listPrice: integer("list_price"),

  // Link Count (number of bracelet links)
  linkCount: integer("link_count"),

  // Listing copy (AI-generated or manual)
  listingTitle: text("listing_title"),
  description: text("description"),

  // Instagram Caption (AI-generated or manual)
  instagramCaption: text("instagram_caption"),

  // Movement Specs (AI-fetched and cached)
  movementSpecs: jsonb("movement_specs"),

  // Shipping & Tracking
  shippingPartner: text("shipping_partner"),
  trackingNumber: text("tracking_number"),
  dateShipped: timestamp("date_shipped"),
  // Customer delivery is a calendar date, not a timezone-dependent timestamp.
  deliveredDate: date("delivered_date", { mode: "string" }),
  soldPlatform: text("sold_platform"),
  
  // Fee snapshot — captures the watch_register_fee at the time of item creation
  // so that admin-panel changes only affect future items, not existing ones.
  watchRegisterFeeSnapshot: integer("watch_register_fee_snapshot"),

  // Credit Payment Tracking
  creditPaid: boolean("credit_paid").default(false),
  creditDueDate: timestamp("credit_due_date"),
  creditNotes: text("credit_notes"),

  // Relations
  clientId: integer("client_id").references(() => clients.id),
  buyerId: integer("buyer_id").references(() => clients.id),
});

export const inventoryPriceHistory = pgTable("inventory_price_history", {
  id: serial("id").primaryKey(),
  // Kept nullable so removing a watch does not remove its saved price history.
  inventoryId: integer("inventory_id").references(() => inventory.id),
  listPrice: integer("list_price").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (table) => [index("inventory_price_history_watch_date_idx").on(table.inventoryId, table.recordedAt)]);

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, archivedAt: true });
export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryPriceHistory = typeof inventoryPriceHistory.$inferSelect;

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
  priceHistory: many(inventoryPriceHistory),
}));

export const inventoryPriceHistoryRelations = relations(inventoryPriceHistory, ({ one }) => ({
  inventory: one(inventory, {
    fields: [inventoryPriceHistory.inventoryId],
    references: [inventory.id],
  }),
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
