import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateInventoryRequest, type UpdateInventoryRequest } from "@shared/routes";
import { normalizeWatchSerial } from "@shared/serial-match";

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
      const response = await fetch(`${api.inventory.serialMatches.path}?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not check saved watch serial numbers.");
      return api.inventory.serialMatches.responses[200].parse(await response.json());
    },
    enabled: enabled && Boolean(normalizedSerial || normalizedInternalSerial),
    staleTime: 15_000,
    retry: false,
  });
}

export function useInventory(status?: string, includeArchived = false) {
  return useQuery({
    queryKey: [api.inventory.list.path, status, includeArchived],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (includeArchived) params.set("includeArchived", "true");
      const query = params.toString();
      const url = query ? `${api.inventory.list.path}?${query}` : api.inventory.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return api.inventory.list.responses[200].parse(await res.json());
    },
  });
}

export function useInventoryItem(id: number) {
  return useQuery({
    queryKey: [api.inventory.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.inventory.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch inventory item");
      return api.inventory.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useInventoryPriceHistory(id: number) {
  return useQuery({
    queryKey: [api.inventory.priceHistory.path, id],
    queryFn: async () => {
      const url = buildUrl(api.inventory.priceHistory.path, { id });
      const response = await fetch(url, { credentials: "include" });
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("Could not load listed price history.");
      return api.inventory.priceHistory.responses[200].parse(await response.json());
    },
    enabled: !!id,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInventoryRequest) => {
      const res = await fetch(api.inventory.create.path, {
        method: api.inventory.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to create inventory item");
      }
      return api.inventory.create.responses[201].parse(await res.json());
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      if (variables.saleBuyer) {
        queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
        queryClient.invalidateQueries({ queryKey: [api.clients.get.path] });
      }
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateInventoryRequest & { id: number }) => {
      const url = buildUrl(api.inventory.update.path, { id });
      const res = await fetch(url, {
        method: api.inventory.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to update inventory item");
      }
      return api.inventory.update.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.inventory.get.path, data.id] });
      queryClient.invalidateQueries({ queryKey: [api.inventory.priceHistory.path, data.id] });
      if (variables.saleBuyer) {
        queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
        queryClient.invalidateQueries({ queryKey: [api.clients.get.path] });
      }
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.delete.path, { id });
      const res = await fetch(url, { method: api.inventory.delete.method, credentials: "include" });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || "Failed to delete inventory item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
    },
  });
}

export function useArchivedInventory() {
  return useQuery({
    queryKey: [api.inventory.archived.path],
    queryFn: async () => {
      const res = await fetch(api.inventory.archived.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load archived watches");
      return api.inventory.archived.responses[200].parse(await res.json());
    },
  });
}

async function postInventoryLifecycleAction(path: string, id: number, fallback: string) {
  const res = await fetch(buildUrl(path, { id }), { method: "POST", credentials: "include" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message || fallback);
  }
  return res.json();
}

function invalidateInventoryLifecycleQueries(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.inventory.archived.path] });
  queryClient.invalidateQueries({ queryKey: [api.inventory.get.path, id] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
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
