import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateInventoryRequest, type UpdateInventoryRequest } from "@shared/routes";
import { normalizeWatchSerial } from "@shared/serial-match";
import { apiJson, apiRequest, readApiJson } from "@/lib/queryClient";
import { refreshData } from "@/lib/refresh-data";
import type { CreateInventoryTimingReading, InventoryTimingSettings } from "@shared/timing";

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
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (serialNumber?.trim()) params.set("serialNumber", serialNumber.trim());
      if (internalSerial?.trim()) params.set("internalSerial", internalSerial.trim());
      if (excludeId != null) params.set("excludeId", String(excludeId));
      return apiJson("GET", `${api.inventory.serialMatches.path}?${params.toString()}`,
        undefined, api.inventory.serialMatches.responses[200], { signal });
    },
    enabled: enabled && Boolean(normalizedSerial || normalizedInternalSerial),
    staleTime: 15_000,
    retry: false,
  });
}

export function useInventory(status?: string, includeArchived = false) {
  return useQuery({
    queryKey: [api.inventory.list.path, status, includeArchived],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (includeArchived) params.set("includeArchived", "true");
      const query = params.toString();
      const url = query ? `${api.inventory.list.path}?${query}` : api.inventory.list.path;
      return apiJson("GET", url, undefined, api.inventory.list.responses[200], { signal });
    },
  });
}

export function useInventoryItem(id: number) {
  return useQuery({
    queryKey: [api.inventory.get.path, id],
    queryFn: async ({ signal }) => {
      const url = buildUrl(api.inventory.get.path, { id });
      const res = await apiRequest("GET", url, undefined, { signal, allowStatuses: [404] });
      if (res.status === 404) return null;
      return readApiJson(res, api.inventory.get.responses[200]);
    },
    enabled: !!id,
  });
}

export function useInventoryPriceHistory(id: number) {
  return useQuery({
    queryKey: [api.inventory.priceHistory.path, id],
    queryFn: async ({ signal }) => {
      const url = buildUrl(api.inventory.priceHistory.path, { id });
      return apiJson("GET", url, undefined, api.inventory.priceHistory.responses[200], { signal });
    },
    enabled: !!id,
  });
}

export function useInventoryTimingReadings(id: number) {
  return useQuery({
    queryKey: [api.inventory.timingReadings.list.path, id],
    queryFn: ({ signal }) => apiJson(
      "GET",
      buildUrl(api.inventory.timingReadings.list.path, { id }),
      undefined,
      api.inventory.timingReadings.list.responses[200],
      { signal },
    ),
    enabled: !!id,
  });
}

export function useInventoryTimingSettings(id: number) {
  return useQuery({
    queryKey: [api.inventory.timingSettings.get.path, id],
    queryFn: ({ signal }) => apiJson(
      "GET",
      buildUrl(api.inventory.timingSettings.get.path, { id }),
      undefined,
      api.inventory.timingSettings.get.responses[200],
      { signal },
    ),
    enabled: !!id,
  });
}

export function useCreateInventoryTimingReading(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reading: CreateInventoryTimingReading) => apiJson(
      api.inventory.timingReadings.create.method,
      buildUrl(api.inventory.timingReadings.create.path, { id }),
      reading,
      api.inventory.timingReadings.create.responses[201],
    ),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: [api.inventory.timingReadings.list.path, id],
    }),
  });
}

export function useUpdateInventoryTimingSettings(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: InventoryTimingSettings) => apiJson(
      api.inventory.timingSettings.update.method,
      buildUrl(api.inventory.timingSettings.update.path, { id }),
      settings,
      api.inventory.timingSettings.update.responses[200],
    ),
    onSuccess: (settings) => {
      queryClient.setQueryData([api.inventory.timingSettings.get.path, id], settings);
    },
  });
}

export function useUpdateInventoryPriceHistory(inventoryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ historyId, listPrice }: { historyId: number; listPrice: number }) => {
      const url = buildUrl(api.inventory.updatePriceHistory.path, { id: inventoryId, historyId });
      return apiJson(api.inventory.updatePriceHistory.method, url, { listPrice },
        api.inventory.updatePriceHistory.responses[200]);
    },
    onSuccess: () => refreshData(queryClient, "priceHistory"),
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInventoryRequest) => {
      return apiJson(api.inventory.create.method, api.inventory.create.path, data, api.inventory.create.responses[201]);
    },
    onSuccess: () => refreshData(queryClient, "inventory"),
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateInventoryRequest & { id: number }) => {
      const url = buildUrl(api.inventory.update.path, { id });
      return apiJson(api.inventory.update.method, url, data, api.inventory.update.responses[200]);
    },
    onSuccess: () => refreshData(queryClient, "inventory"),
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.delete.path, { id });
      await apiRequest(api.inventory.delete.method, url);
    },
    onSuccess: async (_data, id) => {
      queryClient.setQueryData([api.inventory.get.path, id], null);
      queryClient.removeQueries({ queryKey: [api.inventory.priceHistory.path, id] });
      await refreshData(queryClient, "inventory");
    },
  });
}

export function useArchivedInventory() {
  return useQuery({
    queryKey: [api.inventory.archived.path],
    queryFn: ({ signal }) => apiJson("GET", api.inventory.archived.path, undefined,
      api.inventory.archived.responses[200], { signal }),
  });
}

async function postInventoryLifecycleAction(path: string, id: number) {
  return apiJson("POST", buildUrl(path, { id }));
}

export function useArchiveInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postInventoryLifecycleAction(api.inventory.archive.path, id),
    onSuccess: () => refreshData(queryClient, "inventory"),
  });
}

export function useRestoreInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postInventoryLifecycleAction(api.inventory.restore.path, id),
    onSuccess: () => refreshData(queryClient, "inventory"),
  });
}
