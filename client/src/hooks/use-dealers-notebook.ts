import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient, readApiJson, apiJson } from "@/lib/queryClient";
import type {
  NotebookAction,
  NotebookComparisonMode,
  NotebookEntry,
  NotebookReport,
  NotebookInventorySnapshot,
} from "@shared/dealers-notebook";

export interface DealerNotebookState {
  entry: NotebookEntry;
  previousMonthKey: string;
  previousActions: NotebookAction[];
  liveStock: NotebookReport["currentStock"];
  liveStockAsOf: string;
  canCaptureInventory: boolean;
  comparisonSnapshots: Array<{ monthKey: string; snapshot: NotebookInventorySnapshot | null }>;
}

async function readNotebookResponse(response: Response): Promise<DealerNotebookState> {
  return readApiJson<DealerNotebookState>(response);
}

function notebookQueryKey(monthKey: string) {
  return ["/api/dealers-notebook", monthKey] as const;
}

export function useDealerNotebookEntry(monthKey: string) {
  return useQuery({
    queryKey: notebookQueryKey(monthKey),
    queryFn: ({ signal }) => apiJson<DealerNotebookState>("GET",
      `/api/dealers-notebook/${encodeURIComponent(monthKey)}`, undefined, undefined, { signal }),
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
      return client.invalidateQueries({ queryKey: ["/api/dealers-notebook"] });
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
      return client.invalidateQueries({ queryKey: ["/api/dealers-notebook"] });
    },
  });
}

export function useCaptureDealerNotebookInventory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (monthKey: string) => readNotebookResponse(
      await apiRequest("POST", `/api/dealers-notebook/${encodeURIComponent(monthKey)}/inventory-snapshot`),
    ),
    onSuccess: result => {
      client.setQueryData(notebookQueryKey(result.entry.monthKey), result);
      return client.invalidateQueries({ queryKey: ["/api/dealers-notebook"] });
    },
  });
}

export function useRefreshDealerNotebook(monthKey: string) {
  return () => queryClient.invalidateQueries({ queryKey: notebookQueryKey(monthKey) });
}
