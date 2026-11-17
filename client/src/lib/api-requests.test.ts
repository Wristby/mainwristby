import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiJson, apiRequest, ApiError, getQueryFn } from "./queryClient";
import { reducer } from "@/hooks/use-toast";

afterEach(() => vi.unstubAllGlobals());

describe("shared API requests", () => {
  it("does not let a save confirmation replace the refresh warning", () => {
    const warned = reducer({ toasts: [] }, {
      type: "ADD_TOAST",
      toast: { id: "warning", title: "Could not refresh saved data", variant: "destructive" },
    });
    const saved = reducer(warned, { type: "ADD_TOAST", toast: { id: "saved", title: "Saved" } });
    expect(saved.toasts.map(toast => toast.id)).toEqual(["saved", "warning"]);
  });
  it("keeps credentials, cancellation, and falsy JSON input", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await apiRequest("PUT", "/api/settings/example", false, { signal: controller.signal });
    expect(fetch).toHaveBeenCalledWith("/api/settings/example", expect.objectContaining({
      credentials: "include", body: "false", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    }));
  });

  it("preserves server validation messages and field names", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      message: "Enter a valid email address.", field: "email",
    }, { status: 400 })));
    await expect(apiRequest("POST", "/api/clients", {})).rejects.toMatchObject({
      name: "ApiError", status: 400, field: "email", message: "Enter a valid email address.",
    });
  });

  it.each([401, 403, 404, 409, 429, 500, 502])("handles non-JSON HTTP %s without leaking HTML", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>proxy stack trace</html>", { status })));
    const error = await apiRequest("GET", "/api/inventory").catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(status);
    expect(error.message).not.toMatch(/html|stack trace|Unexpected token/);
    expect(error.message.length).toBeGreaterThan(15);
  });

  it("uses an expired-session message for private requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Unauthorized" }, { status: 401 })));
    await expect(apiRequest("PUT", "/api/inventory/1", {})).rejects.toMatchObject({
      status: 401, message: "Your session has expired. Please sign in again.",
    });
  });

  it("reports network failures once without retrying a write", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);
    await expect(apiRequest("POST", "/api/expenses", {})).rejects.toMatchObject({ status: 0 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not convert cancellation into a network error", async () => {
    const controller = new AbortController();
    controller.abort();
    const aborted = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(aborted));
    await expect(apiRequest("GET", "/api/clients", undefined, { signal: controller.signal })).rejects.toBe(aborted);
  });

  it("rejects malformed success data with a readable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>login</html>")));
    await expect(apiJson("GET", "/api/inventory")).rejects.toThrow("unexpected response");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ name: 42 })));
    await expect(apiJson("GET", "/api/clients/1", undefined, z.object({ name: z.string() })))
      .rejects.toThrow("incomplete or incompatible data");
  });

  it("retains explicit not-found and signed-out lookup behavior", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    expect((await apiRequest("GET", "/api/inventory/999", undefined, { allowStatuses: [404] })).status).toBe(404);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const fn = getQueryFn({ on401: "returnNull" });
    const context = { queryKey: ["/api/auth/user"], signal: new AbortController().signal } as Parameters<typeof fn>[0];
    await expect(fn(context)).resolves.toBeNull();
    await expect(getQueryFn({ on401: "throw" })(context)).rejects.toMatchObject({ status: 401 });
  });
});
