import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiJson, apiRequest } from "@/lib/queryClient";
import { refreshData } from "@/lib/refresh-data";

export function useClients(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [api.clients.list.path],
    enabled: options.enabled ?? true,
    queryFn: ({ signal }) => apiJson("GET", api.clients.list.path, undefined, api.clients.list.responses[200], { signal }),
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [api.clients.get.path, id],
    queryFn: async ({ signal }) => {
      const url = buildUrl(api.clients.get.path, { id });
      return apiJson("GET", url, undefined, api.clients.get.responses[200], { signal });
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return apiJson(api.clients.create.method, api.clients.create.path, data, api.clients.create.responses[201]);
    },
    onSuccess: () => refreshData(queryClient, "clients"),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const url = buildUrl(api.clients.update.path, { id });
      return apiJson(api.clients.update.method, url, data, api.clients.update.responses[200]);
    },
    onSuccess: () => refreshData(queryClient, "clients"),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.clients.delete.path, { id });
      await apiRequest(api.clients.delete.method, url);
      return true;
    },
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: [api.clients.get.path, id] });
      await refreshData(queryClient, "clients");
    },
  });
}
