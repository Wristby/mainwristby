import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, jsonb, index, uniqueIndex, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import type {
  NotebookAction,
  NotebookComparisonMode,
  NotebookInventorySnapshot,
  NotebookReport,
} from "./dealers-notebook";
import type { ServiceVisit } from "./service-history";

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

export const dealerNotebookEntries = pgTable("dealer_notebook_entries", {
  monthKey: varchar("month_key", { length: 7 }).primaryKey(),
  comparisonMode: text("comparison_mode", {
    enum: ["previous-month", "same-month-last-year", "prior-three-months"],
  }).$type<NotebookComparisonMode>().notNull().default("previous-month"),
  contextNote: text("context_note").notNull().default(""),
  report: jsonb("report").$type<NotebookReport | null>(),
  inventorySnapshot: jsonb("inventory_snapshot").$type<NotebookInventorySnapshot | null>(),
  actions: jsonb("actions").$type<NotebookAction[]>().notNull().default([]),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type DealerNotebookEntry = typeof dealerNotebookEntries.$inferSelect;

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
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
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
  serviceHistory: jsonb("service_history").$type<ServiceVisit[]>().notNull().default([]),
  
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
  chrono24CertificationSent: boolean("chrono24_certification_sent").default(false).notNull(),
  chrono24CertificationSentAt: timestamp("chrono24_certification_sent_at", { withTimezone: true }),
  dateShipped: timestamp("date_shipped"),
  // Customer delivery is a calendar date, not a timezone-dependent timestamp.
  deliveredDate: date("delivered_date", { mode: "string" }),
  soldPlatform: text("sold_platform"),
  // The store warranty term is captured per watch so later setting changes do
  // not alter existing sales. Null means not recorded; zero means no warranty.
  storeWarrantyMonths: integer("store_warranty_months"),
  manufacturerPurchaseDate: date("manufacturer_purchase_date", { mode: "string" }),
  manufacturerWarrantyExpires: date("manufacturer_warranty_expires", { mode: "string" }),
  manufacturerWarrantyCardPresent: boolean("manufacturer_warranty_card_present").default(false).notNull(),
  manufacturerWarrantyDetails: text("manufacturer_warranty_details"),
  
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

// A watch can be sold, returned, and sold again. Sale rows are immutable history
// snapshots; inventory continues to hold the watch's current editable details.
export const inventorySales = pgTable("inventory_sales", {
  id: serial("id").primaryKey(),
  // Preserve sale history if the watch itself is deleted.
  inventoryId: integer("inventory_id").references(() => inventory.id, { onDelete: "set null" }),
  cycleNumber: integer("cycle_number").notNull(),
  brandSnapshot: text("brand_snapshot").notNull(),
  modelSnapshot: text("model_snapshot").notNull(),
  referenceNumberSnapshot: text("reference_number_snapshot").notNull(),
  serialNumberSnapshot: text("serial_number_snapshot"),
  salePrice: integer("sale_price").notNull().default(0),
  soldTo: text("sold_to"),
  buyerId: integer("buyer_id").references(() => clients.id, { onDelete: "set null" }),
  platformFees: integer("platform_fees").notNull().default(0),
  chrono24FeeRate: integer("chrono24_fee_rate"),
  shippingFee: integer("shipping_fee").notNull().default(0),
  insuranceFee: integer("insurance_fee").notNull().default(0),
  soldDate: timestamp("sold_date"),
  soldPlatform: text("sold_platform"),
  shippingPartner: text("shipping_partner"),
  trackingNumber: text("tracking_number"),
  dateShipped: timestamp("date_shipped"),
  deliveredDate: date("delivered_date", { mode: "string" }),
  purchaseDateSnapshot: timestamp("purchase_date_snapshot"),
  dateListedSnapshot: timestamp("date_listed_snapshot"),
  purchasePriceSnapshot: integer("purchase_price_snapshot").notNull().default(0),
  importFeeSnapshot: integer("import_fee_snapshot").notNull().default(0),
  serviceFeeSnapshot: integer("service_fee_snapshot").notNull().default(0),
  polishFeeSnapshot: integer("polish_fee_snapshot").notNull().default(0),
  watchRegisterFeeSnapshot: integer("watch_register_fee_snapshot").notNull().default(0),
  watchRegisterSnapshot: boolean("watch_register_snapshot").notNull().default(false),
  acquisitionCostCents: integer("acquisition_cost_cents").notNull().default(0),
  profitAtSaleCents: integer("profit_at_sale_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("inventory_sales_watch_cycle_unique").on(table.inventoryId, table.cycleNumber),
  index("inventory_sales_sold_date_idx").on(table.soldDate),
]);

// Derived readings only; raw microphone audio stays in the browser and is
// never stored or sent to the API.
export const inventoryTimingSettingsTable = pgTable("inventory_timing_settings", {
  inventoryId: integer("inventory_id").primaryKey().references(() => inventory.id, { onDelete: "cascade" }),
  liftAngleDegrees: real("lift_angle_degrees").notNull().default(52),
  beatRateVph: integer("beat_rate_vph"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventoryTimingReadings = pgTable("inventory_timing_readings", {
  id: serial("id").primaryKey(),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id, { onDelete: "cascade" }),
  measuredAt: timestamp("measured_at", { withTimezone: true }).defaultNow().notNull(),
  captureDurationSeconds: real("capture_duration_seconds").notNull(),
  sampleRateHz: integer("sample_rate_hz").notNull(),
  readingWindowSeconds: real("reading_window_seconds").notNull(),
  requestedBeatRateVph: integer("requested_beat_rate_vph"),
  beatRateVph: integer("beat_rate_vph"),
  liftAngleDegrees: real("lift_angle_degrees").notNull(),
  rateSecondsPerDay: real("rate_seconds_per_day"),
  amplitudeDegrees: real("amplitude_degrees"),
  beatErrorMs: real("beat_error_ms"),
  beatErrorSource: text("beat_error_source"),
  jitterMicroseconds: real("jitter_microseconds"),
  beatsUsed: integer("beats_used").notNull(),
  spanSeconds: real("span_seconds").notNull(),
  watchHeard: boolean("watch_heard").notNull(),
  findingBeat: boolean("finding_beat").notNull(),
  snr: real("snr"),
  clippedFraction: real("clipped_fraction"),
  engineVersion: text("engine_version").notNull().default("1.1.0"),
}, (table) => [
  index("inventory_timing_readings_watch_measured_idx").on(table.inventoryId, table.measuredAt),
]);

export const inventoryReturns = pgTable("inventory_returns", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => inventorySales.id),
  status: text("status", {
    enum: ["requested", "approved", "in_transit", "received", "inspected", "completed", "cancelled", "declined"],
  }).notNull().default("requested"),
  requestDate: date("request_date", { mode: "string" }).notNull(),
  reason: text("reason").notNull().default(""),
  returnShippedDate: date("return_shipped_date", { mode: "string" }),
  receivedDate: date("received_date", { mode: "string" }),
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  shippingCostCents: integer("shipping_cost_cents").notNull().default(0),
  shippingPayer: text("shipping_payer", { enum: ["seller", "buyer", "marketplace"] }).notNull().default("seller"),
  refundAmountCents: integer("refund_amount_cents").notNull().default(0),
  refundDate: date("refund_date", { mode: "string" }),
  inspectionCondition: text("inspection_condition"),
  missingItems: text("missing_items"),
  inspectionNotes: text("inspection_notes"),
  inspectionCostCents: integer("inspection_cost_cents").notNull().default(0),
  nextAction: text("next_action", { enum: ["relist", "service", "hold"] }).notNull().default("hold"),
  // The purchase cost remains unchanged on the watch. This credit records that
  // the asset returned to inventory, keeping sale-cycle profit from double-counting it.
  cogsRestoredCents: integer("cogs_restored_cents").notNull().default(0),
  platformFeeRefunded: boolean("platform_fee_refunded").notNull().default(false),
  completedDate: date("completed_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("inventory_returns_sale_idx").on(table.saleId, table.createdAt),
  index("inventory_returns_received_idx").on(table.receivedDate),
]);

export const inventoryPriceHistory = pgTable("inventory_price_history", {
  id: serial("id").primaryKey(),
  // Kept nullable so removing a watch does not remove its saved price history.
  inventoryId: integer("inventory_id").references(() => inventory.id),
  listPrice: integer("list_price").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (table) => [index("inventory_price_history_watch_date_idx").on(table.inventoryId, table.recordedAt)]);

export type PersonalCollectionFee = {
  label: string;
  amount: number;
};

export type PersonalCollectionTechnicalDetails = Record<string, string>;

// Personal watches are intentionally separate from dealer inventory, sales,
// clients, and business expenses. Each record belongs to its signed-in owner.
export const personalCollectionWatches = pgTable("personal_collection_watches", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dateBought: date("date_bought", { mode: "string" }),
  referenceNumber: text("reference_number").notNull(),
  manufacturer: text("manufacturer").notNull(),
  model: text("model"),
  subModel: text("sub_model"),
  condition: text("condition").notNull().default("Pre-owned"),
  conditionGrade: text("condition_grade").notNull().default("Not graded"),
  year: integer("year"),
  serialNumber: text("serial_number"),
  linkCount: text("link_count"),
  bracelet: text("bracelet"),
  bezel: text("bezel"),
  dial: text("dial"),
  box: boolean("box").notNull().default(false),
  boxForWholesale: boolean("box_for_wholesale").notNull().default(false),
  papers: boolean("papers").notNull().default(false),
  warrantyCardDate: date("warranty_card_date", { mode: "string" }),
  warrantyExpiration: date("warranty_expiration", { mode: "string" }),
  conditionNotes: text("condition_notes"),
  contentsNotes: text("contents_notes"),
  acquisitionPlatform: text("acquisition_platform"),
  tradeIn: boolean("trade_in").notNull().default(false),
  boughtFrom: text("bought_from"),
  purchasePrice: integer("purchase_price"),
  estimatedValue: integer("estimated_value"),
  msrp: integer("msrp"),
  intakeFees: jsonb("intake_fees").$type<PersonalCollectionFee[]>().notNull().default([]),
  notes: text("notes"),
  technicalDetails: jsonb("technical_details").$type<PersonalCollectionTechnicalDetails>().notNull().default({}),
  gdriveLink: text("gdrive_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("personal_collection_owner_idx").on(table.ownerId),
  index("personal_collection_owner_bought_idx").on(table.ownerId, table.dateBought),
]);

export const personalCollectionValuations = pgTable("personal_collection_valuations", {
  id: serial("id").primaryKey(),
  watchId: integer("watch_id").notNull().references(() => personalCollectionWatches.id, { onDelete: "cascade" }),
  valuationDate: date("valuation_date", { mode: "string" }).notNull(),
  estimatedValue: integer("estimated_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("personal_collection_valuation_watch_date_idx")
    .on(table.watchId, table.valuationDate.desc(), table.createdAt.desc()),
]);

export const insertPersonalCollectionWatchSchema = createInsertSchema(personalCollectionWatches).omit({
  id: true, ownerId: true, createdAt: true, updatedAt: true,
});
export type PersonalCollectionWatch = typeof personalCollectionWatches.$inferSelect;
export type InsertPersonalCollectionWatch = z.infer<typeof insertPersonalCollectionWatchSchema>;
export type PersonalCollectionValuation = typeof personalCollectionValuations.$inferSelect;
export type InsertPersonalCollectionValuation = typeof personalCollectionValuations.$inferInsert;

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  archivedAt: true,
  chrono24CertificationSentAt: true,
});
export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryPriceHistory = typeof inventoryPriceHistory.$inferSelect;
export type InventorySale = typeof inventorySales.$inferSelect;
export type InventoryReturn = typeof inventoryReturns.$inferSelect;
export type InventoryTimingReading = typeof inventoryTimingReadings.$inferSelect;
export type InsertInventoryTimingReading = typeof inventoryTimingReadings.$inferInsert;
export type InventoryTimingSetting = typeof inventoryTimingSettingsTable.$inferSelect;

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
  sales: many(inventorySales),
}));

export const inventorySalesRelations = relations(inventorySales, ({ one, many }) => ({
  inventory: one(inventory, {
    fields: [inventorySales.inventoryId],
    references: [inventory.id],
  }),
  buyer: one(clients, {
    fields: [inventorySales.buyerId],
    references: [clients.id],
  }),
  returns: many(inventoryReturns),
}));

export const inventoryReturnsRelations = relations(inventoryReturns, ({ one }) => ({
  sale: one(inventorySales, {
    fields: [inventoryReturns.saleId],
    references: [inventorySales.id],
  }),
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
