import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MutationObserver, QueryClient, type MutationObserverOptions } from "@tanstack/react-query";
import { useCreateInventory, useUpdateInventory, useDeleteInventory, useArchiveInventory, useRestoreInventory } from "@/hooks/use-inventory";
import { useUpdateClient, useDeleteClient } from "@/hooks/use-clients";
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { useUpdateSetting } from "@/hooks/use-settings";
import { useUpdatePersonalCollectionWatch, useUpdatePersonalCollectionValuation, useDeletePersonalCollectionWatch } from "@/hooks/use-personal-collection";
import { useSaveDealerNotebookActions } from "@/hooks/use-dealers-notebook";
import { queryClient as appClient } from "./queryClient";

let client: QueryClient;
vi.mock("@tanstack/react-query", async importOriginal => ({
  ...await importOriginal<typeof import("@tanstack/react-query")>(),
  // Inspect the hooks' real mutation options, then run them through a real
  // MutationObserver below. No React renderer or business database required.
  useMutation: (options: unknown) => options,
  useQueryClient: () => client,
}));

async function execute(hook: unknown, variables: unknown) {
  const options = hook as MutationObserverOptions<unknown, Error, unknown>;
  const observer = new MutationObserver(client, { ...options, retry: false });
  return observer.mutate(variables);
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  client.clear();
  appClient.clear();
  vi.unstubAllGlobals();
});

describe("mutation refresh wiring", () => {
  it.each([
    ["create", useCreateInventory, { brand: "Cartier" }],
    ["update", useUpdateInventory, { id: 35, listPrice: 600_000 }],
    ["archive", useArchiveInventory, 35],
    ["restore", useRestoreInventory, 35],
    ["delete", useDeleteInventory, 35],
  ] as const)("refreshes watch detail, list, dashboard and client totals after %s", async (_action, hook, input) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: 35 }))));
    const keys = [["/api/inventory/:id", 35], ["/api/inventory", "sold", true],
      ["/api/dashboard/stats"], ["/api/clients"], ["/api/expenses"], ["/api/dealers-notebook", "2026-10"]];
    keys.forEach(key => client.setQueryData(key, {}));
    await execute(hook(), input);
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it("does not refresh or call success when a save fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(
      Response.json({ message: "This email is invalid.", field: "email" }, { status: 400 }),
    )));
    client.setQueryData(["/api/clients"], [{ id: 1, name: "Original" }]);
    const success = vi.fn();
    const options = useUpdateClient() as unknown as MutationObserverOptions<unknown, Error, unknown>;
    const observer = new MutationObserver(client, {
      ...options,
      onSuccess: async (...args) => { await options.onSuccess?.(...args); success(); },
    });
    await expect(observer.mutate({ id: 1, email: "bad" })).rejects.toThrow("This email is invalid.");
    expect(success).not.toHaveBeenCalled();
    expect(client.getQueryState(["/api/clients"])?.isInvalidated).toBe(false);
    expect(client.getQueryData(["/api/clients"])).toEqual([{ id: 1, name: "Original" }]);
  });

  it.each([
    [useCreateExpense, { inventoryId: 35, amount: 100 }],
    [useUpdateExpense, { id: 2, amount: 200 }],
    [useDeleteExpense, 2],
  ] as const)("refreshes related watch and financial data after expense changes", async (hook, input) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: 2 }))));
    const keys = [["/api/expenses"], ["/api/inventory/:id", 35], ["/api/dashboard/stats"]];
    keys.forEach(key => client.setQueryData(key, []));
    await execute(hook(), input);
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it("removes a deleted client detail and refreshes embedded buyer and seller information", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    client.setQueryData(["/api/clients/:id", 3], { id: 3 });
    client.setQueryData(["/api/inventory/:id", 35], { id: 35 });
    await execute(useDeleteClient(), 3);
    expect(client.getQueryData(["/api/clients/:id", 3])).toBeUndefined();
    expect(client.getQueryState(["/api/inventory/:id", 35])?.isInvalidated).toBe(true);
  });

  it("refreshes setting-dependent dashboard and Notebook data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ value: 600 })));
    const keys = [["/api/settings"], ["/api/dashboard/stats"], ["/api/dealers-notebook", "2026-10"]];
    keys.forEach(key => appClient.setQueryData(key, {}));
    await execute(useUpdateSetting(), { key: "watch_register_fee", value: 600 });
    for (const key of keys) expect(appClient.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it("refreshes collection valuations and list totals without touching business inventory", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: 35 }))));
    const keys = [["/api/personal-collection"], ["/api/personal-collection/:id", 35],
      ["/api/personal-collection/:id/valuations", 35]];
    keys.forEach(key => client.setQueryData(key, {}));
    client.setQueryData(["/api/inventory"], []);
    await execute(useUpdatePersonalCollectionWatch(35), { notes: "Updated" });
    await execute(useUpdatePersonalCollectionValuation(35), {
      valuationId: 1, data: { valuationDate: "2026-10-01", estimatedValue: 100_000 },
    });
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(["/api/inventory"])?.isInvalidated).toBe(false);
  });

  it("clears deleted collection watch and valuation caches", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    client.setQueryData(["/api/personal-collection/:id", 35], {});
    client.setQueryData(["/api/personal-collection/:id/valuations", 35], []);
    await execute(useDeletePersonalCollectionWatch(), 35);
    expect(client.getQueryData(["/api/personal-collection/:id", 35])).toBeUndefined();
    expect(client.getQueryData(["/api/personal-collection/:id/valuations", 35])).toBeUndefined();
  });

  it("refreshes other Notebook months after changing actions used by a later month's review", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      entry: { monthKey: "2026-10" }, previousMonthKey: "2026-09",
    })));
    client.setQueryData(["/api/dealers-notebook", "2026-11"], {});
    await execute(useSaveDealerNotebookActions(), { monthKey: "2026-10", actions: [] });
    expect(client.getQueryState(["/api/dealers-notebook", "2026-11"])?.isInvalidated).toBe(true);
  });
});
