import { afterEach, describe, expect, it, vi } from "vitest";
import { MutationObserver, QueryClient, QueryObserver } from "@tanstack/react-query";
import { refreshData } from "./refresh-data";
import { queryClient as appClient } from "./queryClient";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
afterEach(() => { appClient.clear(); vi.clearAllMocks(); });

const watchKeys = [
  ["/api/inventory", undefined, false],
  ["/api/inventory", "sold", true],
  ["/api/inventory/:id", 35],
  ["/api/inventory/35"],
  ["/api/inventory/archived"],
  ["/api/inventory/:id/price-history", 35],
  ["/api/inventory/serial-matches", "ABC"],
];

describe("dependent-data refresh rules", () => {
  it("invalidates all watch key variants, dashboard, clients, expenses and Notebook after a watch save", async () => {
    const client = new QueryClient();
    const keys = [...watchKeys, ["/api/clients"], ["/api/clients/:id", 2], ["/api/expenses"],
      ["/api/dashboard/stats"], ["/api/dealers-notebook", "2026-10"]];
    for (const key of keys) client.setQueryData(key, []);
    client.setQueryData(["/api/personal-collection"], []);
    client.setQueryData(["/api/settings"], {});
    await refreshData(client, "inventory");
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(["/api/personal-collection"])?.isInvalidated).toBe(false);
    expect(client.getQueryState(["/api/settings"])?.isInvalidated).toBe(false);
    client.clear();
  });

  it.each(["clients", "expenses"] as const)("refreshes embedded watch data after changing %s", async change => {
    const client = new QueryClient();
    client.setQueryData(["/api/inventory/:id", 35], { id: 35 });
    client.setQueryData(["/api/expenses"], []);
    await refreshData(client, change);
    expect(client.getQueryState(["/api/inventory/:id", 35])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["/api/expenses"])?.isInvalidated).toBe(true);
    client.clear();
  });

  it("keeps personal collection changes separate from business reports", async () => {
    const client = new QueryClient();
    const collectionKeys = [["/api/personal-collection"], ["/api/personal-collection/:id", 1],
      ["/api/personal-collection/:id/valuations", 1]];
    for (const key of collectionKeys) client.setQueryData(key, []);
    client.setQueryData(["/api/inventory"], []);
    await refreshData(client, "personalCollection");
    for (const key of collectionKeys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(["/api/inventory"])?.isInvalidated).toBe(false);
    client.clear();
  });

  it("awaits active refetches but only marks unopened pages stale", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    client.setQueryData(["/api/dashboard/stats"], { total: 1 });
    client.setQueryData(["/api/clients"], []);
    const inactiveFetch = vi.fn();
    client.setQueryDefaults(["/api/clients"], { queryFn: inactiveFetch });
    let complete: (value: { total: number }) => void = () => {};
    const fetch = vi.fn(() => new Promise<{ total: number }>(resolve => { complete = resolve; }));
    const observer = new QueryObserver(client, { queryKey: ["/api/dashboard/stats"], queryFn: fetch });
    const unsubscribe = observer.subscribe(() => {});
    let refreshed = false;
    const pending = refreshData(client, "inventory").then(() => { refreshed = true; });
    expect(refreshed).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(inactiveFetch).not.toHaveBeenCalled();
    complete({ total: 2 });
    await pending;
    expect(client.getQueryData(["/api/dashboard/stats"])).toEqual({ total: 2 });
    unsubscribe();
    client.clear();
  });

  it("warns on refresh failure without falsely reporting that the write failed", async () => {
    appClient.setQueryData(["/api/dashboard/stats"], { total: 1 });
    const observer = new QueryObserver(appClient, {
      queryKey: ["/api/dashboard/stats"],
      queryFn: () => Promise.reject(new Error("Please try again.")),
    });
    const unsubscribe = observer.subscribe(() => {});
    const success = vi.fn();
    const mutation = new MutationObserver(appClient, {
      mutationFn: async () => ({ saved: true }),
      onSuccess: async () => { await refreshData(appClient, "inventory"); success(); },
    });
    await expect(mutation.mutate()).resolves.toEqual({ saved: true });
    expect(success).toHaveBeenCalledOnce();
    expect(appClient.getQueryData(["/api/dashboard/stats"])).toEqual({ total: 1 });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Could not refresh saved data", variant: "destructive",
    }));
    unsubscribe();
  });
});
