import { api } from "@shared/routes";
import type { InventorySaleWithReturns } from "@shared/sales-lifecycle";
import { useQuery } from "@tanstack/react-query";

export const salesQueryKey = [api.sales.list.path] as const;

export function useSales() {
  return useQuery<InventorySaleWithReturns[]>({
    queryKey: [...salesQueryKey],
  });
}

export function useWatchSales(inventoryId: number | undefined) {
  const path = inventoryId
    ? api.sales.forWatch.path.replace(":id", String(inventoryId))
    : null;
  return useQuery<InventorySaleWithReturns[]>({
    queryKey: path ? [path] : ["/api/inventory/unselected/sales"],
    enabled: Boolean(path),
  });
}

export const returnStatusLabels: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  in_transit: "In transit",
  received: "Received for inspection",
  inspected: "Inspected",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

export const returnNextActionLabels: Record<string, string> = {
  relist: "Ready to relist",
  service: "Send for service",
  hold: "Hold for now",
};
