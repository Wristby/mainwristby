import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateExpenseRequest } from "@shared/routes";
import { apiJson, apiRequest } from "@/lib/queryClient";
import { refreshData } from "@/lib/refresh-data";

export function useExpenses() {
  return useQuery({
    queryKey: [api.expenses.list.path],
    queryFn: ({ signal }) => apiJson("GET", api.expenses.list.path, undefined, api.expenses.list.responses[200], { signal }),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      return apiJson(api.expenses.create.method, api.expenses.create.path, data, api.expenses.create.responses[201]);
    },
    onSuccess: () => refreshData(queryClient, "expenses"),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateExpenseRequest> & { id: number }) => {
      const url = buildUrl(api.expenses.update.path, { id });
      return apiJson(api.expenses.update.method, url, data, api.expenses.update.responses[200]);
    },
    onSuccess: () => refreshData(queryClient, "expenses"),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      await apiRequest(api.expenses.delete.method, url);
    },
    onSuccess: () => refreshData(queryClient, "expenses"),
  });
}
