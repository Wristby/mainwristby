import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { PersonalCollectionInput, PersonalCollectionValuationInput } from "@shared/personal-collection";
import { apiJson, apiRequest, readApiJson } from "@/lib/queryClient";
import { refreshData } from "@/lib/refresh-data";

export const personalCollectionQueryKeys = {
  list: [api.personalCollection.list.path] as const,
  detail: (id: number) => [api.personalCollection.get.path, id] as const,
  valuations: (id: number) => [api.personalCollection.valuations.path, id] as const,
};

export function usePersonalCollection() {
  return useQuery({
    queryKey: personalCollectionQueryKeys.list,
    queryFn: ({ signal }) => apiJson("GET", api.personalCollection.list.path, undefined,
      api.personalCollection.list.responses[200], { signal }),
  });
}

export function usePersonalCollectionWatch(id: number) {
  return useQuery({
    queryKey: personalCollectionQueryKeys.detail(id),
    queryFn: async ({ signal }) => {
      const response = await apiRequest("GET", buildUrl(api.personalCollection.get.path, { id }), undefined,
        { signal, allowStatuses: [404] });
      if (response.status === 404) return null;
      return readApiJson(response, api.personalCollection.get.responses[200]);
    },
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function usePersonalCollectionValuations(id: number) {
  return useQuery({
    queryKey: personalCollectionQueryKeys.valuations(id),
    queryFn: ({ signal }) => apiJson("GET", buildUrl(api.personalCollection.valuations.path, { id }), undefined,
      api.personalCollection.valuations.responses[200], { signal }),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreatePersonalCollectionValuation(watchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PersonalCollectionValuationInput) => {
      return apiJson(api.personalCollection.createValuation.method,
        buildUrl(api.personalCollection.createValuation.path, { id: watchId }), data,
        api.personalCollection.createValuation.responses[201]);
    },
    onSuccess: () => refreshData(queryClient, "personalCollection"),
  });
}

export function useUpdatePersonalCollectionValuation(watchId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ valuationId, data }: { valuationId: number; data: PersonalCollectionValuationInput }) => {
      return apiJson(api.personalCollection.updateValuation.method,
        buildUrl(api.personalCollection.updateValuation.path, { id: watchId, valuationId }), data,
        api.personalCollection.updateValuation.responses[200]);
    },
    onSuccess: () => refreshData(queryClient, "personalCollection"),
  });
}

export function useCreatePersonalCollectionWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PersonalCollectionInput) => {
      return apiJson(api.personalCollection.create.method, api.personalCollection.create.path, data,
        api.personalCollection.create.responses[201]);
    },
    onSuccess: () => refreshData(queryClient, "personalCollection"),
  });
}

export function useUpdatePersonalCollectionWatch(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PersonalCollectionInput>) => {
      return apiJson(api.personalCollection.update.method, buildUrl(api.personalCollection.update.path, { id }),
        data, api.personalCollection.update.responses[200]);
    },
    onSuccess: (watch) => {
      queryClient.setQueryData(personalCollectionQueryKeys.detail(watch.id), watch);
      return refreshData(queryClient, "personalCollection");
    },
  });
}

export function useDeletePersonalCollectionWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(api.personalCollection.delete.method, buildUrl(api.personalCollection.delete.path, { id }));
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: personalCollectionQueryKeys.detail(id) });
      queryClient.removeQueries({ queryKey: personalCollectionQueryKeys.valuations(id) });
      return refreshData(queryClient, "personalCollection");
    },
  });
}
