import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  NotebookAction,
  NotebookComparisonMode,
  NotebookEntry,
} from "@shared/dealers-notebook";

export interface DealerNotebookState {
  entry: NotebookEntry;
  previousMonthKey: string;
  previousActions: NotebookAction[];
}

async function readNotebookResponse(response: Response): Promise<DealerNotebookState> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Could not load Dealer's Notebook.");
  }
  return response.json() as Promise<DealerNotebookState>;
}

function notebookQueryKey(monthKey: string) {
  return ["/api/dealers-notebook", monthKey] as const;
}

export function useDealerNotebookEntry(monthKey: string) {
  return useQuery({
    queryKey: notebookQueryKey(monthKey),
    queryFn: async () => readNotebookResponse(await fetch(`/api/dealers-notebook/${encodeURIComponent(monthKey)}`, {
      credentials: "include",
    })),
    enabled: /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey),
  });
}

export function useSaveDealerNotebookContext() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ monthKey, contextNote }: { monthKey: string; contextNote: string }) => {
      const response = await apiRequest("PUT", `/api/dealers-notebook/${encodeURIComponent(monthKey)}/context`, { contextNote });
      return readNotebookResponse(response);
    },
    onSuccess: (result) => {
      client.setQueryData(notebookQueryKey(result.entry.monthKey), result);
    },
  });
}

export function useSaveDealerNotebookActions() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ monthKey, actions }: { monthKey: string; actions: NotebookAction[] }) => {
      const response = await apiRequest("PUT", `/api/dealers-notebook/${encodeURIComponent(monthKey)}/actions`, { actions });
      return readNotebookResponse(response);
    },
    onSuccess: (result) => {
      client.setQueryData(notebookQueryKey(result.entry.monthKey), result);
      client.invalidateQueries({ queryKey: notebookQueryKey(result.previousMonthKey) });
    },
  });
}

export function useGenerateDealerNotebookReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      monthKey: string;
      comparisonMode: NotebookComparisonMode;
      contextNote: string;
    }) => {
      const response = await apiRequest("POST", "/api/dealers-notebook/analyze", input);
      return readNotebookResponse(response);
    },
    onSuccess: (result) => {
      client.setQueryData(notebookQueryKey(result.entry.monthKey), result);
      client.invalidateQueries({ queryKey: notebookQueryKey(result.previousMonthKey) });
    },
  });
}

export function useRefreshDealerNotebook(monthKey: string) {
  return () => queryClient.invalidateQueries({ queryKey: notebookQueryKey(monthKey) });
}
