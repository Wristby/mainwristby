import { z } from 'zod';
import {
  insertClientSchema, insertInventorySchema, insertExpenseSchema, clients, inventory, expenses,
  inventoryPriceHistory, inventorySales, inventoryReturns, inventoryTimingReadings,
  type InventoryItem, type InventorySale, type InventoryReturn,
} from './schema';
import { deliveryDateError } from './delivery';
import { saleBuyerSchema, type SaleBuyerInput } from './sale-buyer';
import { personalCollectionInputSchema, personalCollectionValuationInputSchema } from './personal-collection';
import { personalCollectionValuations, personalCollectionWatches, type PersonalCollectionWatch } from './schema';
import { isCalendarDate } from './delivery';
import { storeWarrantyMonthsSchema } from './warranty';
import { serviceVisitSchema } from './service-history';
import { createInventoryTimingReadingSchema, inventoryTimingSettingsSchema } from './timing';

// Helper to transform date strings to Date objects or null
const dateStringToDate = z.union([
  z.string().transform((val) => val ? new Date(val) : null),
  z.date(),
  z.null(),
]).optional().nullable();

// Extended inventory schema that properly handles date strings from JSON
const inventoryInputSchema = insertInventorySchema.extend({
  // Accept both legacy values and the labels shown in Watch Details.
  condition: z.enum(["New", "Mint", "Used", "Damaged", "Good", "Very Good", "Excellent", "Like New"]),
  chrono24FeeRate: z.number().int().min(0).max(10000).nullable().optional(),
  purchaseDate: dateStringToDate,
  dateListed: dateStringToDate,
  soldDate: dateStringToDate,
  dateSold: dateStringToDate,
  dateReceived: dateStringToDate,
  serviceStartDate: dateStringToDate,
  dateSentToService: dateStringToDate,
  dateReturnedFromService: dateStringToDate,
  serviceHistory: z.array(serviceVisitSchema).optional(),
  dateShipped: dateStringToDate,
  deliveredDate: z.string().superRefine((value, context) => {
    const message = deliveryDateError(value);
    if (message) context.addIssue({ code: z.ZodIssueCode.custom, message });
  }).nullable().optional(),
  storeWarrantyMonths: storeWarrantyMonthsSchema,
  manufacturerPurchaseDate: z.string().nullable().optional().refine(
    value => value == null || isCalendarDate(value),
    "Enter a valid manufacturer purchase date.",
  ),
  manufacturerWarrantyExpires: z.string().nullable().optional().refine(
    value => value == null || isCalendarDate(value),
    "Enter a valid manufacturer warranty end date.",
  ),
  manufacturerWarrantyCardPresent: z.boolean().optional(),
  manufacturerWarrantyDetails: z.string().max(2000).nullable().optional(),
});

const validateManufacturerWarrantyDates = (
  value: { manufacturerPurchaseDate?: string | null; manufacturerWarrantyExpires?: string | null },
  context: z.RefinementCtx,
) => {
  if (value.manufacturerPurchaseDate && value.manufacturerWarrantyExpires
    && value.manufacturerPurchaseDate > value.manufacturerWarrantyExpires) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manufacturerWarrantyExpires"],
      message: "The manufacturer warranty end date must be on or after the original purchase date.",
    });
  }
};

// Extended expense schema that properly handles date strings from JSON
const expenseInputSchema = insertExpenseSchema.extend({
  date: z.union([
    z.string().transform((val) => val ? new Date(val) : new Date()),
    z.date(),
  ]),
});

const returnStatusSchema = z.enum([
  "requested", "approved", "in_transit", "received", "inspected", "completed", "cancelled", "declined",
]);
const calendarDateInput = z.string().nullable().optional().refine(
  value => value == null || isCalendarDate(value),
  "Enter a valid date.",
);
const inventoryReturnInputSchema = z.object({
  requestDate: z.string().refine(isCalendarDate, "Enter a valid request date."),
  reason: z.string().max(2000).default(""),
});
const inventoryReturnUpdateSchema = z.object({
  status: returnStatusSchema.optional(),
  requestDate: z.string().optional().refine(
    value => value == null || isCalendarDate(value),
    "Enter a valid request date.",
  ),
  reason: z.string().max(2000).optional(),
  returnShippedDate: calendarDateInput,
  receivedDate: calendarDateInput,
  carrier: z.string().max(200).nullable().optional(),
  trackingNumber: z.string().max(500).nullable().optional(),
  shippingCostCents: z.number().int().min(0).optional(),
  shippingPayer: z.enum(["seller", "buyer", "marketplace"]).optional(),
  refundAmountCents: z.number().int().min(0).optional(),
  refundDate: calendarDateInput,
  inspectionCondition: z.string().max(300).nullable().optional(),
  missingItems: z.string().max(2000).nullable().optional(),
  inspectionNotes: z.string().max(4000).nullable().optional(),
  inspectionCostCents: z.number().int().min(0).optional(),
  nextAction: z.enum(["relist", "service", "hold"]).optional(),
  platformFeeRefunded: z.boolean().optional(),
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id',
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/clients/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  inventory: {
    serialMatches: {
      method: 'GET' as const,
      path: '/api/inventory/serial-matches',
      responses: {
        200: z.array(z.custom<Pick<InventoryItem, "id" | "brand" | "model" | "referenceNumber" | "serialNumber" | "internalSerial" | "status" | "dateSold" | "soldDate" | "archivedAt"> & {
          matchedFields: Array<"serialNumber" | "internalSerial">;
        }>()),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/inventory',
      input: z.object({
        status: z.enum(["in_stock", "sold", "incoming", "servicing"]).optional(),
        includeArchived: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof inventory.$inferSelect & { seller?: typeof clients.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/inventory/:id',
      responses: {
        200: z.custom<typeof inventory.$inferSelect & { expenses?: typeof expenses.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    priceHistory: {
      method: 'GET' as const,
      path: '/api/inventory/:id/price-history',
      responses: {
        200: z.array(z.custom<typeof inventoryPriceHistory.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    updatePriceHistory: {
      method: 'PATCH' as const,
      path: '/api/inventory/:id/price-history/:historyId',
      input: z.object({ listPrice: z.number().int().positive() }),
      responses: {
        200: z.custom<typeof inventoryPriceHistory.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    timingSettings: {
      get: {
        method: "GET" as const,
        path: "/api/inventory/:id/timing-settings",
        responses: {
          200: inventoryTimingSettingsSchema,
          404: errorSchemas.notFound,
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/inventory/:id/timing-settings",
        input: inventoryTimingSettingsSchema,
        responses: {
          200: inventoryTimingSettingsSchema,
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
    },
    timingReadings: {
      list: {
        method: "GET" as const,
        path: "/api/inventory/:id/timing-readings",
        responses: {
          200: z.array(z.custom<typeof inventoryTimingReadings.$inferSelect>()),
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/inventory/:id/timing-readings",
        input: createInventoryTimingReadingSchema,
        responses: {
          201: z.custom<typeof inventoryTimingReadings.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
    },
    archived: {
      method: 'GET' as const,
      path: '/api/inventory/archived',
      responses: {
        200: z.array(z.custom<typeof inventory.$inferSelect & { seller?: typeof clients.$inferSelect }>()),
      },
    },
    archive: {
      method: 'POST' as const,
      path: '/api/inventory/:id/archive',
      responses: {
        200: z.custom<typeof inventory.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    restore: {
      method: 'POST' as const,
      path: '/api/inventory/:id/restore',
      responses: {
        200: z.custom<typeof inventory.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/inventory',
      input: inventoryInputSchema.extend({ saleBuyer: saleBuyerSchema.optional() }).superRefine(validateManufacturerWarrantyDates),
      responses: {
        201: z.custom<typeof inventory.$inferSelect>(),
        400: errorSchemas.validation,
        409: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/inventory/:id',
      input: inventoryInputSchema.partial().extend({ saleBuyer: saleBuyerSchema.optional() }).superRefine(validateManufacturerWarrantyDates),
      responses: {
        200: z.custom<typeof inventory.$inferSelect>(),
        400: errorSchemas.validation,
        409: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/inventory/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  sales: {
    list: {
      method: "GET" as const,
      path: "/api/sales",
      responses: {
        200: z.array(z.custom<InventorySale & { returns: InventoryReturn[] }>()),
      },
    },
    forWatch: {
      method: "GET" as const,
      path: "/api/inventory/:id/sales",
      responses: {
        200: z.array(z.custom<InventorySale & { returns: InventoryReturn[] }>()),
        404: errorSchemas.notFound,
      },
    },
    createReturn: {
      method: "POST" as const,
      path: "/api/sales/:saleId/returns",
      input: inventoryReturnInputSchema,
      responses: {
        201: z.custom<typeof inventoryReturns.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        409: errorSchemas.validation,
      },
    },
  },
  returns: {
    update: {
      method: "PATCH" as const,
      path: "/api/returns/:id",
      input: inventoryReturnUpdateSchema,
      responses: {
        200: z.custom<typeof inventoryReturns.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        409: errorSchemas.validation,
      },
    },
  },
  personalCollection: {
    list: {
      method: 'GET' as const,
      path: '/api/personal-collection',
      responses: { 200: z.array(z.custom<PersonalCollectionWatch>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/personal-collection/:id',
      responses: {
        200: z.custom<PersonalCollectionWatch>(),
        404: errorSchemas.notFound,
      },
    },
    valuations: {
      method: 'GET' as const,
      path: '/api/personal-collection/:id/valuations',
      responses: {
        200: z.array(z.custom<typeof personalCollectionValuations.$inferSelect>()),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    createValuation: {
      method: 'POST' as const,
      path: '/api/personal-collection/:id/valuations',
      input: personalCollectionValuationInputSchema,
      responses: {
        201: z.custom<typeof personalCollectionValuations.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    updateValuation: {
      method: 'PATCH' as const,
      path: '/api/personal-collection/:id/valuations/:valuationId',
      input: personalCollectionValuationInputSchema,
      responses: {
        200: z.custom<typeof personalCollectionValuations.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/personal-collection',
      input: personalCollectionInputSchema,
      responses: {
        201: z.custom<PersonalCollectionWatch>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/personal-collection/:id',
      input: personalCollectionInputSchema.partial(),
      responses: {
        200: z.custom<PersonalCollectionWatch>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/personal-collection/:id',
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses',
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses',
      input: expenseInputSchema,
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/expenses/:id',
      input: expenseInputSchema.partial(),
      responses: {
        200: z.custom<typeof expenses.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalInventoryValue: z.number(),
          totalProfit: z.number(),
          activeInventoryCount: z.number(),
          soldInventoryCount: z.number(),
          turnRate: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateInventoryRequest = z.input<typeof api.inventory.create.input>;
export type UpdateInventoryRequest = Partial<CreateInventoryRequest> & { saleBuyer?: SaleBuyerInput };
export type CreateExpenseRequest = z.infer<typeof insertExpenseSchema>;
