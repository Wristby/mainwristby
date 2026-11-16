import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { PersonalCollectionInput } from "@shared/personal-collection";

export const personalCollectionQueryKeys = {
  list: [api.personalCollection.list.path] as const,
  detail: (id: number) => [api.personalCollection.get.path, id] as const,
};

async function readError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => null);
  return new Error(payload?.message || fallback);
}

export function usePersonalCollection() {
  return useQuery({
    queryKey: personalCollectionQueryKeys.list,
    queryFn: async () => {
      const response = await fetch(api.personalCollection.list.path, { credentials: "include" });
      if (!response.ok) throw await readError(response, "Could not load your collection.");
      return api.personalCollection.list.responses[200].parse(await response.json());
    },
  });
}

export function usePersonalCollectionWatch(id: number) {
  return useQuery({
    queryKey: personalCollectionQueryKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(buildUrl(api.personalCollection.get.path, { id }), { credentials: "include" });
      if (response.status === 404) return null;
      if (!response.ok) throw await readError(response, "Could not load this collection watch.");
      return api.personalCollection.get.responses[200].parse(await response.json());
    },
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreatePersonalCollectionWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PersonalCollectionInput) => {
      const response = await fetch(api.personalCollection.create.path, {
        method: api.personalCollection.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw await readError(response, "Could not add this collection watch.");
      return api.personalCollection.create.responses[201].parse(await response.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.list });
    },
  });
}

export function useUpdatePersonalCollectionWatch(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PersonalCollectionInput>) => {
      const response = await fetch(buildUrl(api.personalCollection.update.path, { id }), {
        method: api.personalCollection.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw await readError(response, "Could not save this collection watch.");
      return api.personalCollection.update.responses[200].parse(await response.json());
    },
    onSuccess: (watch) => {
      queryClient.setQueryData(personalCollectionQueryKeys.detail(watch.id), watch);
      queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.list });
    },
  });
}

export function useDeletePersonalCollectionWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(buildUrl(api.personalCollection.delete.path, { id }), {
        method: api.personalCollection.delete.method,
        credentials: "include",
      });
      if (!response.ok) throw await readError(response, "Could not delete this collection watch.");
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: personalCollectionQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.list });
    },
  });
}
