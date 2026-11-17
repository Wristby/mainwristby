import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiJson } from "@/lib/queryClient";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: ({ signal }) => apiJson("GET", api.dashboard.stats.path, undefined, api.dashboard.stats.responses[200], { signal }),
  });
}
