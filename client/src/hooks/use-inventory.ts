import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateInventoryRequest, type UpdateInventoryRequest } from "@shared/routes";

export function useInventory(status?: string) {
  return useQuery({
    queryKey: [api.inventory.list.path, status],
    queryFn: async () => {
      const url = status 
        ? `${api.inventory.list.path}?status=${status}` 
        : api.inventory.list.path;
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
        const error = await res.json();
        throw new Error(error.message || "Failed to create inventory item");
      }
      return api.inventory.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
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
      if (!res.ok) throw new Error("Failed to update inventory item");
      return api.inventory.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.inventory.get.path, data.id] });
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.delete.path, { id });
      const res = await fetch(url, { method: api.inventory.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete inventory item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
    },
  });
}
