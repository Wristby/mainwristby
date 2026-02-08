import { z } from 'zod';
import { insertClientSchema, insertInventorySchema, insertExpenseSchema, clients, inventory, expenses } from './schema';

// Helper to transform date strings to Date objects or null
const dateStringToDate = z.union([
  z.string().transform((val) => val ? new Date(val) : null),
  z.date(),
  z.null(),
]).optional().nullable();

// Extended inventory schema that properly handles date strings from JSON
const inventoryInputSchema = insertInventorySchema.extend({
  purchaseDate: dateStringToDate,
  dateListed: dateStringToDate,
  soldDate: dateStringToDate,
  dateSold: dateStringToDate,
  dateReceived: dateStringToDate,
  dateSentToService: dateStringToDate,
  dateReturnedFromService: dateStringToDate,
});

// Extended expense schema that properly handles date strings from JSON
const expenseInputSchema = insertExpenseSchema.extend({
  date: z.union([
    z.string().transform((val) => val ? new Date(val) : new Date()),
    z.date(),
  ]),
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
    list: {
      method: 'GET' as const,
      path: '/api/inventory',
      input: z.object({
        status: z.enum(["in_stock", "sold", "incoming", "servicing"]).optional(),
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
    create: {
      method: 'POST' as const,
      path: '/api/inventory',
      input: inventoryInputSchema,
      responses: {
        201: z.custom<typeof inventory.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/inventory/:id',
      input: inventoryInputSchema.partial(),
      responses: {
        200: z.custom<typeof inventory.$inferSelect>(),
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

export type CreateInventoryRequest = z.infer<typeof insertInventorySchema>;
export type UpdateInventoryRequest = Partial<CreateInventoryRequest>;
export type CreateExpenseRequest = z.infer<typeof insertExpenseSchema>;
