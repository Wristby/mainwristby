import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiFetch } from "@/lib/queryClient";
import { queryKeys } from "@/lib/query-cache";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const res = await apiFetch(api.dashboard.stats.path, {}, "Could not load dashboard statistics.");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}
