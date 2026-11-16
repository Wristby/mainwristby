import type { QueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export const queryKeys = {
  clients: {
    list: [api.clients.list.path] as const,
    details: [api.clients.get.path] as const,
    detail: (id: number) => [api.clients.get.path, id] as const,
  },
  inventory: {
    lists: [api.inventory.list.path] as const,
    list: (status?: string, includeArchived = false) =>
      [api.inventory.list.path, status, includeArchived] as const,
    details: [api.inventory.get.path] as const,
    detail: (id: number) => [api.inventory.get.path, id] as const,
    archived: [api.inventory.archived.path] as const,
    priceHistories: [api.inventory.priceHistory.path] as const,
    priceHistory: (id: number) => [api.inventory.priceHistory.path, id] as const,
  },
  expenses: {
    list: [api.expenses.list.path] as const,
  },
  dashboard: {
    stats: [api.dashboard.stats.path] as const,
  },
} as const;

type InvalidationClient = Pick<QueryClient, "invalidateQueries">;

async function invalidate(client: InvalidationClient, keys: readonly (readonly unknown[])[]) {
  await Promise.all(keys.map(queryKey => client.invalidateQueries({ queryKey })));
}

export function invalidateWatchCaches(
  client: InvalidationClient,
  id?: number,
  options: { includeExpenses?: boolean; includeClients?: boolean } = {},
) {
  const keys: (readonly unknown[])[] = [
    queryKeys.inventory.lists,
    queryKeys.inventory.archived,
    queryKeys.dashboard.stats,
  ];
  if (id != null) {
    keys.push(queryKeys.inventory.detail(id), queryKeys.inventory.priceHistory(id));
  }
  if (options.includeExpenses) keys.push(queryKeys.expenses.list);
  if (options.includeClients) {
    keys.push(queryKeys.clients.list, queryKeys.clients.details);
  }
  return invalidate(client, keys);
}

export function invalidateClientCaches(
  client: InvalidationClient,
  id?: number,
  options: { includeInventory?: boolean } = {},
) {
  const keys: (readonly unknown[])[] = [
    queryKeys.clients.list,
    id == null ? queryKeys.clients.details : queryKeys.clients.detail(id),
  ];
  if (options.includeInventory) {
    keys.push(queryKeys.inventory.lists, queryKeys.inventory.details);
  }
  return invalidate(client, keys);
}

export function invalidateExpenseCaches(client: InvalidationClient) {
  return invalidate(client, [
    queryKeys.expenses.list,
    queryKeys.inventory.lists,
    queryKeys.inventory.details,
    queryKeys.dashboard.stats,
  ]);
}
