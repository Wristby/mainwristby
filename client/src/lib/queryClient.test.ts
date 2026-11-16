import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { apiFetch, apiRequest, ApiError } from "./queryClient";
import { invalidateWatchCaches, queryKeys } from "./query-cache";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shared API request handling", () => {
  it("shows the server's error message and retains its HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "The watch could not be updated." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(apiFetch("/api/inventory/4"))
      .rejects.toMatchObject({ name: "ApiError", message: "The watch could not be updated.", status: 409 });
  });

  it("uses a useful fallback for non-JSON server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response("<html>proxy error</html>", { status: 502, statusText: "Bad Gateway" }),
    ));

    await expect(apiFetch("/api/inventory", {}, "Could not load inventory."))
      .rejects.toMatchObject({ message: "Could not load inventory.", status: 502 });
  });

  it("reports connection failures without exposing request details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("socket disconnected")));

    await expect(apiFetch("/api/clients"))
      .rejects.toMatchObject({
        name: "ApiError",
        message: "Could not reach the server. Check your connection and try again.",
        status: 0,
      } satisfies Partial<ApiError>);
  });

  it("sends explicitly provided falsy JSON bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("PUT", "/api/settings/example", false);

    expect(fetchMock).toHaveBeenCalledWith("/api/settings/example", expect.objectContaining({
      method: "PUT",
      body: "false",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }));
  });
});

describe("shared cache invalidation", () => {
  it("refreshes matching inventory lists, the saved watch, expenses, and dashboard stats", async () => {
    const client = new QueryClient();
    const keys = [
      queryKeys.inventory.list("sold"),
      queryKeys.inventory.detail(42),
      queryKeys.expenses.list,
      queryKeys.dashboard.stats,
    ] as const;
    for (const key of keys) client.setQueryData(key, {});

    await invalidateWatchCaches(client, 42, { includeExpenses: true });

    for (const key of keys) {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    }
    client.clear();
  });
});
