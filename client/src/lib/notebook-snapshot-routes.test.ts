import { afterAll, beforeAll, beforeEach, describe, expect, vi } from "vitest";
import { ownerIt as it } from "./owner-test";
import express from "express";
import { createServer } from "node:http";
import type { DealerNotebookEntry } from "@shared/schema";
import type { NotebookReport } from "@shared/dealers-notebook";

const mocks = vi.hoisted(() => ({
  authenticated: true,
  entries: new Map<string, DealerNotebookEntry>(),
  capture: vi.fn(),
  saveReport: vi.fn(),
}));
vi.mock("../../../server/auth", () => ({
  setupAuth: async () => {},
  requirePro: (_req: unknown, _res: unknown, next: () => void) => next(),
  isAuthenticated: (_req: unknown, res: express.Response, next: () => void) =>
    mocks.authenticated ? next() : res.status(401).json({ message: "Unauthorized" }),
}));
vi.mock("../../../server/retention", () => ({
  registerRetentionRoutes: () => {},
  RetentionError: class extends Error {},
}));
vi.mock("../../../server/client-backfill", () => ({ registerClientBackfillRoutes: () => {} }));
vi.mock("../../../server/storage", () => ({
  NotebookSnapshotError: class extends Error {
    constructor(message: string, public status: number) { super(message); }
  },
  SaleBuyerSaveError: class extends Error {},
  storage: {
    getAccountIds: async () => [],
    getWorkspaceAccess: async () => ({ isPro: true, plan: "pro", aiEnabled: true, activeWatchCount: 0, clientCount: 0, limits: null }),
    getSetting: async () => undefined,
    getClients: async () => [{ id: 1 }],
    getAllSettings: async () => ({}),
    upsertSetting: async () => {},
    getNotebookInventoryData: async () => [],
    getNotebookPriceHistory: async () => [],
    getDealerNotebookEntry: async (monthKey: string) => mocks.entries.get(monthKey),
    captureDealerNotebookInventorySnapshot: mocks.capture,
    saveDealerNotebookReport: mocks.saveReport,
  },
}));
import { registerRoutes } from "../../../server/routes";
import { NotebookSnapshotError } from "../../../server/storage";
import { calculateNotebookInventorySnapshot } from "@shared/dealers-notebook";

const app = express();
app.use(express.json());
const server = createServer(app);
let base: string;
beforeAll(async () => {
  await registerRoutes(server, app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});
beforeEach(() => {
  mocks.authenticated = true;
  mocks.capture.mockReset();
  mocks.saveReport.mockReset();
  mocks.entries.clear();
});

describe("month-end notebook API", () => {
  it("requires authentication for capture and for reading historical inventory", async () => {
    mocks.authenticated = false;
    expect((await fetch(`${base}/api/dealers-notebook/2026-09/inventory-snapshot`, { method: "POST" })).status).toBe(401);
    expect((await fetch(`${base}/api/dealers-notebook/2026-09`)).status).toBe(401);
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("rejects malformed months and exposes a clear conflict for missed captures", async () => {
    expect((await fetch(`${base}/api/dealers-notebook/2026-13/inventory-snapshot`, { method: "POST" })).status).toBe(400);
    expect(mocks.capture).not.toHaveBeenCalled();
    mocks.capture.mockRejectedValue(new NotebookSnapshotError("Earlier months cannot be reconstructed.", 409));
    const response = await fetch(`${base}/api/dealers-notebook/2026-09/inventory-snapshot`, { method: "POST" });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Earlier months cannot be reconstructed." });
  });

  it("captures without AI, ignores supplied totals, and returns historical and live data separately", async () => {
    const snapshot = calculateNotebookInventorySnapshot([], "2026-09", 600, new Date("2026-09-30T12:00:00Z"));
    mocks.capture.mockImplementation(async key => {
      mocks.entries.set(key, {
        monthKey: key, comparisonMode: "previous-month", contextNote: "Keep note",
        inventorySnapshot: snapshot, report: null, actions: [], generatedAt: null, updatedAt: new Date(),
      });
      return snapshot;
    });
    const response = await fetch(`${base}/api/dealers-notebook/2026-09/inventory-snapshot`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costBasisCents: 999999, inventorySnapshot: { activeWatchCount: 999 } }),
    });
    expect(response.status).toBe(200);
    expect(mocks.capture).toHaveBeenCalledExactlyOnceWith("2026-09");
    const data = await response.json();
    expect(data.entry.inventorySnapshot).toEqual(snapshot);
    expect(data.entry.contextNote).toBe("Keep note");
    expect(data.entry.report).toBeNull();
    expect(data.liveStock).toMatchObject({ activeListings: 0 });
    expect(data.comparisonSnapshots).toEqual([{ monthKey: "2026-08", snapshot: null }]);
    expect(mocks.saveReport).not.toHaveBeenCalled();
  });

  it("sends saved month-end evidence to AI without creating or changing a snapshot", async () => {
    const snapshot = calculateNotebookInventorySnapshot([], "2026-09", 600, new Date("2026-09-30T12:00:00Z"));
    mocks.entries.set("2026-09", {
      monthKey: "2026-09", comparisonMode: "previous-month", contextNote: "",
      inventorySnapshot: snapshot, report: null, actions: [], generatedAt: null, updatedAt: new Date(),
    });
    mocks.saveReport.mockImplementation(async (key: string, _mode: string, _note: string, report: NotebookReport) => {
      mocks.entries.set(key, { ...mocks.entries.get(key)!, report });
    });
    const nativeFetch = globalThis.fetch;
    let prompt = "";
    vi.stubEnv("GEMINI_API_KEY", "fixture-not-a-real-key");
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input).startsWith("https://generativelanguage.googleapis.com/")) {
        prompt = String(init?.body);
        return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({
          overview: "Fixture grounded report", wins: [], challenges: [], improvements: [], recommendations: [],
        }) }] } }] }), { status: 200 });
      }
      return nativeFetch(input, init);
    });
    try {
      const response = await fetch(`${base}/api/dealers-notebook/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthKey: "2026-09", comparisonMode: "previous-month", contextNote: "" }),
      });
      expect(response.status).toBe(200);
      expect(prompt).toContain("month_end_stock_2026-09");
      expect(prompt).toContain("do not substitute current stock");
      expect((await response.json()).entry.inventorySnapshot).toEqual(snapshot);
      expect(mocks.capture).not.toHaveBeenCalled();
      expect(mocks.saveReport.mock.calls[0][3].inventorySnapshots).toEqual([snapshot]);
    } finally {
      spy.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it("does not leak database errors when capture fails", async () => {
    mocks.capture.mockRejectedValue(new Error("Private connection detail"));
    const response = await fetch(`${base}/api/dealers-notebook/2026-09/inventory-snapshot`, { method: "POST" });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("Private connection detail");
  });
});
