import type { QueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

type DataChange = "inventory" | "clients" | "expenses" | "settings" | "priceHistory" | "personalCollection";

// Match route-template keys AND literal URL keys. Inventory list variants
// (status and includeArchived) must all become stale together.
const dependencies: Record<DataChange, readonly string[]> = {
  inventory: ["/api/inventory", "/api/clients", "/api/expenses", "/api/sales", api.dashboard.stats.path, "/api/dealers-notebook"],
  clients: ["/api/clients", "/api/inventory", "/api/expenses", "/api/dealers-notebook"],
  expenses: ["/api/expenses", "/api/inventory", api.dashboard.stats.path, "/api/dealers-notebook"],
  settings: ["/api/settings", api.dashboard.stats.path, "/api/dealers-notebook"],
  priceHistory: ["/api/inventory", "/api/dealers-notebook"],
  personalCollection: [api.personalCollection.list.path],
};

export function refreshData(client: QueryClient, change: DataChange): Promise<void> {
  return client.invalidateQueries({
    predicate: ({ queryKey }) => {
      const path = queryKey[0];
      return typeof path === "string" && dependencies[change].some(
        prefix => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`),
      );
    },
    refetchType: "active",
  });
}
