import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiFetch } from "@/lib/queryClient";
import { invalidateClientCaches, queryKeys } from "@/lib/query-cache";

export function useClients(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list,
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const res = await apiFetch(api.clients.list.path, {}, "Could not load clients.");
      return api.clients.list.responses[200].parse(await res.json());
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: async () => {
      const url = buildUrl(api.clients.get.path, { id });
      const res = await apiFetch(url, {}, "Could not load this client.");
      return api.clients.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch(api.clients.create.path, {
        method: api.clients.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not create this client.");
      return api.clients.create.responses[201].parse(await res.json());
    },
    onSuccess: () => invalidateClientCaches(queryClient),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const url = buildUrl(api.clients.update.path, { id });
      const res = await apiFetch(url, {
        method: api.clients.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not update this client.");
      return api.clients.update.responses[200].parse(await res.json());
    },
    onSuccess: client => invalidateClientCaches(queryClient, client.id, { includeInventory: true }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.clients.delete.path, { id });
      await apiFetch(url, {
        method: api.clients.delete.method,
      }, "Could not delete this client.");
      return true;
    },
    onSuccess: (_result, id) => invalidateClientCaches(queryClient, id, { includeInventory: true }),
  });
}
