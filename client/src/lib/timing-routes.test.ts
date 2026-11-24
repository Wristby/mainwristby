import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";

const mocks = vi.hoisted(() => ({
  authenticated: true,
  timingSettings: new Map<number, { liftAngleDegrees: number; beatRateVph: number | null }>(),
  getInventoryItem: vi.fn(),
  getInventoryTimingSettings: vi.fn(),
  updateInventoryTimingSettings: vi.fn(),
  getInventoryTimingReadings: vi.fn(),
  createInventoryTimingReading: vi.fn(),
  getClients: vi.fn(),
}));

vi.mock("../../../server/auth", () => ({
  setupAuth: async () => {},
  isAuthenticated: (_req: unknown, res: express.Response, next: () => void) =>
    mocks.authenticated ? next() : res.status(401).json({ message: "Unauthorized" }),
}));
vi.mock("../../../server/retention", () => ({
  registerRetentionRoutes: () => {},
  RetentionError: class extends Error {},
}));
vi.mock("../../../server/client-backfill", () => ({ registerClientBackfillRoutes: () => {} }));
vi.mock("../../../server/storage", () => ({
  SaleBuyerSaveError: class extends Error {},
  NotebookSnapshotError: class extends Error {},
  ReturnCaseError: class extends Error {},
  storage: {
    getClients: mocks.getClients,
    getAllSettings: async () => new Proxy({}, { has: () => true }),
    getInventoryItem: mocks.getInventoryItem,
    getInventoryTimingSettings: mocks.getInventoryTimingSettings,
    updateInventoryTimingSettings: mocks.updateInventoryTimingSettings,
    getInventoryTimingReadings: mocks.getInventoryTimingReadings,
    createInventoryTimingReading: mocks.createInventoryTimingReading,
  },
}));

import { registerRoutes } from "../../../server/routes";

const app = express();
app.use(express.json());
const server = createServer(app);
let base: string;

beforeAll(async () => {
  mocks.getClients.mockResolvedValue([{ id: 1 }]);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  mocks.authenticated = true;
  mocks.timingSettings = new Map([[35, { liftAngleDegrees: 52, beatRateVph: null }]]);
  mocks.getClients.mockReset().mockResolvedValue([{ id: 1 }]);
  mocks.getInventoryItem.mockReset().mockResolvedValue({ id: 35 });
  mocks.getInventoryTimingSettings.mockReset().mockImplementation(async (id: number) =>
    mocks.timingSettings.get(id) ?? { liftAngleDegrees: 52, beatRateVph: null });
  mocks.updateInventoryTimingSettings.mockReset().mockImplementation(async (id: number, settings) => {
    mocks.timingSettings.set(id, settings);
    return settings;
  });
  mocks.getInventoryTimingReadings.mockReset().mockResolvedValue([]);
  mocks.createInventoryTimingReading.mockReset().mockImplementation(async (_id, reading) => ({
    id: 4,
    inventoryId: 35,
    measuredAt: "2026-11-23T10:00:00.000Z",
    ...reading,
    engineVersion: "1.1.0",
  }));
});

const validReading = {
  captureDurationSeconds: 42,
  sampleRateHz: 48_000,
  readingWindowSeconds: 20,
  requestedBeatRateVph: null,
  beatRateVph: 28_800,
  liftAngleDegrees: 52,
  rateSecondsPerDay: 4.2,
  amplitudeDegrees: 278,
  beatErrorMs: 0.3,
  beatErrorSource: "unlock",
  jitterMicroseconds: 110,
  beatsUsed: 400,
  spanSeconds: 20,
  watchHeard: true,
  findingBeat: false,
  snr: 12,
  clippedFraction: 0,
};

describe("watch timing API", () => {
  it("protects timing settings and reading history behind authentication", async () => {
    mocks.authenticated = false;
    expect((await fetch(`${base}/api/inventory/35/timing-settings`)).status).toBe(401);
    expect((await fetch(`${base}/api/inventory/35/timing-readings`)).status).toBe(401);
    expect(mocks.getInventoryTimingSettings).not.toHaveBeenCalled();
    expect(mocks.getInventoryTimingReadings).not.toHaveBeenCalled();
  });

  it("returns the saved settings and updates per-watch values", async () => {
    const settings = await fetch(`${base}/api/inventory/35/timing-settings`);
    expect(settings.status).toBe(200);
    expect(await settings.json()).toEqual({ liftAngleDegrees: 52, beatRateVph: null });

    const invalid = await fetch(`${base}/api/inventory/35/timing-settings`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ liftAngleDegrees: 72, beatRateVph: 28_800 }),
    });
    expect(invalid.status).toBe(400);
    expect(mocks.updateInventoryTimingSettings).not.toHaveBeenCalled();

    const updated = await fetch(`${base}/api/inventory/35/timing-settings`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ liftAngleDegrees: 48, beatRateVph: 28_800 }),
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({ liftAngleDegrees: 48, beatRateVph: 28_800 });
    expect(mocks.updateInventoryTimingSettings).toHaveBeenCalledWith(35, {
      liftAngleDegrees: 48,
      beatRateVph: 28_800,
    });
  });

  it("stores timing settings independently for each watch", async () => {
    const saveFor = (id: number, settings: { liftAngleDegrees: number; beatRateVph: number | null }) =>
      fetch(`${base}/api/inventory/${id}/timing-settings`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });

    expect((await saveFor(35, { liftAngleDegrees: 38, beatRateVph: 25_200 })).status).toBe(200);
    expect((await saveFor(36, { liftAngleDegrees: 52, beatRateVph: 28_800 })).status).toBe(200);

    const watch35 = await fetch(`${base}/api/inventory/35/timing-settings`);
    const watch36 = await fetch(`${base}/api/inventory/36/timing-settings`);
    expect(await watch35.json()).toEqual({ liftAngleDegrees: 38, beatRateVph: 25_200 });
    expect(await watch36.json()).toEqual({ liftAngleDegrees: 52, beatRateVph: 28_800 });
  });

  it("loads and saves calculated readings while rejecting invalid samples", async () => {
    mocks.getInventoryTimingReadings.mockResolvedValue([{ id: 2, inventoryId: 35 }]);
    const list = await fetch(`${base}/api/inventory/35/timing-readings`);
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual([{ id: 2, inventoryId: 35 }]);

    const invalid = await fetch(`${base}/api/inventory/35/timing-readings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validReading, sampleRateHz: 0 }),
    });
    expect(invalid.status).toBe(400);
    expect(mocks.createInventoryTimingReading).not.toHaveBeenCalled();

    const saved = await fetch(`${base}/api/inventory/35/timing-readings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validReading),
    });
    expect(saved.status).toBe(201);
    expect(mocks.createInventoryTimingReading).toHaveBeenCalledWith(35, validReading);
  });
});
