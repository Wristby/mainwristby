import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateExpenseRequest } from "@shared/routes";
import { apiFetch } from "@/lib/queryClient";
import { invalidateExpenseCaches, queryKeys } from "@/lib/query-cache";

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.list,
    queryFn: async () => {
      const res = await apiFetch(api.expenses.list.path, {}, "Could not load expenses.");
      return api.expenses.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      const res = await apiFetch(api.expenses.create.path, {
        method: api.expenses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not add this expense.");
      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => invalidateExpenseCaches(queryClient),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateExpenseRequest> & { id: number }) => {
      const url = buildUrl(api.expenses.update.path, { id });
      const res = await apiFetch(url, {
        method: api.expenses.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }, "Could not update this expense.");
      return api.expenses.update.responses[200].parse(await res.json());
    },
    onSuccess: () => invalidateExpenseCaches(queryClient),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      await apiFetch(url, { method: api.expenses.delete.method }, "Could not delete this expense.");
    },
    onSuccess: () => invalidateExpenseCaches(queryClient),
  });
}
