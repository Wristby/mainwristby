import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateClientRequest, type UpdateClientRequest } from "@shared/routes";

export function useClients() {
  return useQuery({
    queryKey: [api.clients.list.path],
    queryFn: async () => {
      const res = await fetch(api.clients.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return api.clients.list.responses[200].parse(await res.json());
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [api.clients.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.clients.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch client");
      return api.clients.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClientRequest) => {
      const res = await fetch(api.clients.create.path, {
        method: api.clients.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create client");
      return api.clients.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateClientRequest & { id: number }) => {
      const url = buildUrl(api.clients.update.path, { id });
      const res = await fetch(url, {
        method: api.clients.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update client");
      return api.clients.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
    },
  });
}
