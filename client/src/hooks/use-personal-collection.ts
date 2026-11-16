import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { PersonalCollectionInput, PersonalCollectionValuationInput } from "@shared/personal-collection";
import { apiFetch, fetchApiResponse, throwIfResNotOk } from "@/lib/queryClient";

export const personalCollectionQueryKeys = {
  list: [api.personalCollection.list.path] as const,
  detail: (id: number) => [api.personalCollection.get.path, id] as const,
  valuations: (id: number) => [api.personalCollection.valuations.path, id] as const,
};

export function usePersonalCollection() {
  return useQuery({
    queryKey: personalCollectionQueryKeys.list,
    queryFn: async () => {
      const response = await apiFetch(api.personalCollection.list.path, {}, "Could not load your collection.");
      return api.personalCollection.list.responses[200].parse(await response.json());
    },
  });
}

export function usePersonalCollectionWatch(id: number) {
  return useQuery({
    queryKey: personalCollectionQueryKeys.detail(id),
    queryFn: async () => {
      const response = await fetchApiResponse(buildUrl(api.personalCollection.get.path, { id }));
      if (response.status === 404) return null;
      await throwIfResNotOk(response, "Could not load this collection watch.");
      return api.personalCollection.get.responses[200].parse(await response.json());
    },
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function usePersonalCollectionValuations(id: number) {
  return useQuery({
    queryKey: personalCollectionQueryKeys.valuations(id),
    queryFn: async () => {
      const response = await apiFetch(buildUrl(api.personalCollection.valuations.path, { id }), {}, "Could not load valuation history.");
      return api.personalCollection.valuations.responses[200].parse(await response.json());
    },
    enabled: Number.isInteger(id) && id > 0,
  });
}

function invalidatePersonalValuationQueries(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.valuations(id) });
  queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.list });
}

export function useCreatePersonalCollectionValuation(watchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PersonalCollectionValuationInput) => {
      const response = await apiFetch(buildUrl(api.personalCollection.createValuation.path, { id: watchId }), {
        method: api.personalCollection.createValuation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not add this valuation.");
      return api.personalCollection.createValuation.responses[201].parse(await response.json());
    },
    onSuccess: () => invalidatePersonalValuationQueries(queryClient, watchId),
  });
}

export function useUpdatePersonalCollectionValuation(watchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ valuationId, data }: { valuationId: number; data: PersonalCollectionValuationInput }) => {
      const response = await apiFetch(buildUrl(api.personalCollection.updateValuation.path, { id: watchId, valuationId }), {
        method: api.personalCollection.updateValuation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not correct this valuation.");
      return api.personalCollection.updateValuation.responses[200].parse(await response.json());
    },
    onSuccess: () => invalidatePersonalValuationQueries(queryClient, watchId),
  });
}

export function useCreatePersonalCollectionWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PersonalCollectionInput) => {
      const response = await apiFetch(api.personalCollection.create.path, {
        method: api.personalCollection.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not add this collection watch.");
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
      const response = await apiFetch(buildUrl(api.personalCollection.update.path, { id }), {
        method: api.personalCollection.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not save this collection watch.");
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
      await apiFetch(buildUrl(api.personalCollection.delete.path, { id }), {
        method: api.personalCollection.delete.method,
      }, "Could not delete this collection watch.");
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: personalCollectionQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: personalCollectionQueryKeys.list });
    },
  });
}
