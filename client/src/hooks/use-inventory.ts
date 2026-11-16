import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateInventoryRequest, type UpdateInventoryRequest } from "@shared/routes";
import { normalizeWatchSerial } from "@shared/serial-match";
import { apiFetch, fetchApiResponse, throwIfResNotOk } from "@/lib/queryClient";
import { invalidateWatchCaches, queryKeys } from "@/lib/query-cache";

export function useInventorySerialMatches(
  serialNumber?: string | null,
  internalSerial?: string | null,
  enabled = true,
  excludeId?: number | null,
) {
  const normalizedSerial = normalizeWatchSerial(serialNumber);
  const normalizedInternalSerial = normalizeWatchSerial(internalSerial);
  return useQuery({
    queryKey: [api.inventory.serialMatches.path, normalizedSerial, normalizedInternalSerial, excludeId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serialNumber?.trim()) params.set("serialNumber", serialNumber.trim());
      if (internalSerial?.trim()) params.set("internalSerial", internalSerial.trim());
      if (excludeId != null) params.set("excludeId", String(excludeId));
      const response = await apiFetch(`${api.inventory.serialMatches.path}?${params.toString()}`, {}, "Could not check saved watch serial numbers.");
      return api.inventory.serialMatches.responses[200].parse(await response.json());
    },
    enabled: enabled && Boolean(normalizedSerial || normalizedInternalSerial),
    staleTime: 15_000,
    retry: false,
  });
}

export function useInventory(status?: string, includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.inventory.list(status, includeArchived),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (includeArchived) params.set("includeArchived", "true");
      const query = params.toString();
      const url = query ? `${api.inventory.list.path}?${query}` : api.inventory.list.path;
      const res = await apiFetch(url, {}, "Could not load inventory.");
      return api.inventory.list.responses[200].parse(await res.json());
    },
  });
}

export function useInventoryItem(id: number) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(id),
    queryFn: async () => {
      const url = buildUrl(api.inventory.get.path, { id });
      const res = await fetchApiResponse(url);
      if (res.status === 404) return null;
      await throwIfResNotOk(res, "Could not load this watch.");
      return api.inventory.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useInventoryPriceHistory(id: number) {
  return useQuery({
    queryKey: queryKeys.inventory.priceHistory(id),
    queryFn: async () => {
      const url = buildUrl(api.inventory.priceHistory.path, { id });
      const response = await fetchApiResponse(url);
      if (response.status === 404) return [];
      await throwIfResNotOk(response, "Could not load listed price history.");
      return api.inventory.priceHistory.responses[200].parse(await response.json());
    },
    enabled: !!id,
  });
}

export function useUpdateInventoryPriceHistory(inventoryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ historyId, listPrice }: { historyId: number; listPrice: number }) => {
      const url = buildUrl(api.inventory.updatePriceHistory.path, { id: inventoryId, historyId });
      const response = await apiFetch(url, {
        method: api.inventory.updatePriceHistory.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listPrice }),
      }, "Could not correct the listed price.");
      return api.inventory.updatePriceHistory.responses[200].parse(await response.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.priceHistory(inventoryId) });
    },
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInventoryRequest) => {
      const res = await apiFetch(api.inventory.create.path, {
        method: api.inventory.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not add this watch.");
      return api.inventory.create.responses[201].parse(await res.json());
    },
    onSuccess: (data, variables) => invalidateWatchCaches(queryClient, data.id, {
      includeClients: Boolean(variables.saleBuyer),
    }),
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateInventoryRequest & { id: number }) => {
      const url = buildUrl(api.inventory.update.path, { id });
      const res = await apiFetch(url, {
        method: api.inventory.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not save this watch.");
      return api.inventory.update.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => invalidateWatchCaches(queryClient, data.id, {
      includeClients: Boolean(variables.saleBuyer),
    }),
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.delete.path, { id });
      await apiFetch(url, { method: api.inventory.delete.method }, "Could not delete this watch.");
    },
    onSuccess: (_result, id) => invalidateWatchCaches(queryClient, id, { includeExpenses: true }),
  });
}

export function useArchivedInventory() {
  return useQuery({
    queryKey: queryKeys.inventory.archived,
    queryFn: async () => {
      const res = await apiFetch(api.inventory.archived.path, {}, "Could not load archived watches.");
      return api.inventory.archived.responses[200].parse(await res.json());
    },
  });
}

async function postInventoryLifecycleAction(path: string, id: number, fallback: string) {
  const res = await apiFetch(buildUrl(path, { id }), { method: "POST" }, fallback);
  return res.json();
}

function invalidateInventoryLifecycleQueries(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  return invalidateWatchCaches(queryClient, id);
}

export function useArchiveInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postInventoryLifecycleAction(api.inventory.archive.path, id, "Failed to archive watch"),
    onSuccess: (_item, id) => invalidateInventoryLifecycleQueries(queryClient, id),
  });
}

export function useRestoreInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postInventoryLifecycleAction(api.inventory.restore.path, id, "Failed to restore watch"),
    onSuccess: (_item, id) => invalidateInventoryLifecycleQueries(queryClient, id),
  });
}
