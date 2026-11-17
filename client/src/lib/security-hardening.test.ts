import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";

const fixture = vi.hoisted(() => ({
  query: vi.fn(),
  userExists: true,
}));
vi.mock("../../../server/db", () => ({
  pool: { query: fixture.query },
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => fixture.userExists ? [{
            id: "test-user", username: "test-account", password: "test-hash",
          }] : [],
        }),
      }),
    }),
  },
}));
vi.mock("connect-pg-simple", () => ({
  default: (session: any) => session.MemoryStore,
}));
vi.mock("bcryptjs", () => ({
  default: { compare: async (password: string) => password === "correct-test-password" },
}));
vi.mock("../../../server/storage", () => ({
  storage: {
    getSetting: async () => undefined,
    getClients: async () => [{ id: 1 }],
    getAllSettings: async () => ({}),
    upsertSetting: async () => undefined,
  },
}));
import {
  denyRegistration, initializeLoginProtection, loginAttemptLimit,
  requestMetadataLogger, safeErrorHandler, sameOriginWrites, securityHeaders,
} from "../../../server/security";
import { getSession, setupAuth, isAuthenticated } from "../../../server/auth";
import { registerRoutes } from "../../../server/routes";

let server: Server | undefined;
async function serve(app: express.Express) {
  server = createServer(app);
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "isolated-test-secret-not-a-real-credential");
  vi.stubEnv("NODE_ENV", "test");
  fixture.userExists = true;
  fixture.query.mockReset();
  fixture.query.mockResolvedValue({ rows: [] });
});
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("private app access", () => {
  async function authApp() {
    const app = express();
    app.use(express.json());
    await setupAuth(app);
    app.get("/seed", (req, res) => {
      (req.session as any).testMarker = true;
      res.json({ ok: true });
    });
    app.get("/api/private", isAuthenticated, (_req, res) => res.json({ ok: true }));
    app.use(safeErrorHandler);
    return serve(app);
  }

  it("denies public registration without querying or creating an account", async () => {
    const app = express();
    app.post("/api/register", denyRegistration);
    const url = await serve(app);
    const response = await fetch(`${url}/api/register`, { method: "POST" });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Public registration is disabled." });
    expect(fixture.query).not.toHaveBeenCalled();
  });

  it("keeps existing-account login working and regenerates its session cookie", async () => {
    const url = await authApp();
    const bad = await fetch(`${url}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-account", password: "wrong-password" }),
    });
    expect(bad.status).toBe(401);
    const seed = await fetch(`${url}/seed`);
    const oldCookie = seed.headers.get("set-cookie")!.split(";")[0];
    const response = await fetch(`${url}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: url, Cookie: oldCookie },
      body: JSON.stringify({ username: "test-account", password: "correct-test-password" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("password");
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie.split(";")[0]).not.toBe(oldCookie);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    const privateResponse = await fetch(`${url}/api/private`, {
      headers: { Cookie: cookie.split(";")[0] },
    });
    expect(privateResponse.status).toBe(200);
    fixture.userExists = false;
    const revoked = await fetch(`${url}/api/private`, {
      headers: { Cookie: cookie.split(";")[0] },
    });
    expect(revoked.status).toBe(401);
  });

  it("rejects malformed login credentials and unauthenticated private requests", async () => {
    const url = await authApp();
    const invalid = await fetch(`${url}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ["test-account"], password: {} }),
    });
    expect(invalid.status).toBe(400);
    expect((await fetch(`${url}/api/private`)).status).toBe(401);
  });

  it("fails startup when the session secret is missing", () => {
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => getSession()).toThrow("SESSION_SECRET must be configured.");
  });
});

describe("AI secret isolation", () => {
  it("sends the key only in a server-side header and never returns provider error details", async () => {
    vi.stubEnv("GEMINI_API_KEY", "isolated-dummy-ai-key");
    const app = express();
    app.use(express.json());
    await registerRoutes(createServer(app), app);
    const url = await serve(app);
    const request = globalThis.fetch;
    const login = await request(`${url}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-account", password: "correct-test-password" }),
    });
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    const providerResponse = new Response("simulated-private-provider-details", { status: 400 });
    const responseText = vi.spyOn(providerResponse, "text");
    const providerFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(providerResponse);
    const response = await request(`${url}/api/ai/generate-description`, {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ brand: "Test", model: "Watch" }),
    });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toMatch(/simulated-private-provider-details|isolated-dummy-ai-key/);
    expect(responseText).not.toHaveBeenCalled();
    const [providerUrl, options] = providerFetch.mock.calls[0];
    expect(String(providerUrl)).not.toMatch(/key=|isolated-dummy-ai-key/);
    expect(options?.headers).toMatchObject({ "x-goog-api-key": "isolated-dummy-ai-key" });
  });
});

describe("persistent login throttling", () => {
  it("initializes persistent counters and an expiry index", async () => {
    await initializeLoginProtection();
    expect(fixture.query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS login_attempts");
    expect(fixture.query.mock.calls[1][0]).toContain("CREATE INDEX IF NOT EXISTS");
  });

  it.each([
    { label: "IP", index: 0, attempts: 11 },
    { label: "account", index: 1, attempts: 31 },
  ])("blocks excessive $label attempts and sends Retry-After", async ({ index, attempts }) => {
    fixture.query.mockImplementation(async (sql: string, parameters?: string[][]) => ({
      rows: sql.includes("INSERT INTO") ? [{
        key: parameters![0][index], attempts, retry_after: 600,
      }] : [],
    }));
    const app = express();
    app.use(express.json());
    app.post("/api/login", loginAttemptLimit, (_req, res) => res.json({ ok: true }));
    const url = await serve(app);
    const response = await fetch(`${url}/api/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-account", password: "not-logged" }),
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("600");
    const parameters = fixture.query.mock.calls.at(-1)![1] as string[][];
    expect(parameters[0]).toHaveLength(2);
    expect(parameters[0].every((key) => /^[a-f0-9]{64}$/.test(key))).toBe(true);
    expect(JSON.stringify(parameters)).not.toContain("test-account");
    expect(JSON.stringify(parameters)).not.toContain("not-logged");
  });

  it("fails closed and does not log database details if protection fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fixture.query.mockRejectedValue(new Error("postgres://secret:password@private-host"));
    const app = express();
    app.post("/api/login", loginAttemptLimit, (_req, res) => res.json({ ok: true }));
    const url = await serve(app);
    const response = await fetch(`${url}/api/login`, { method: "POST" });
    expect(response.status).toBe(503);
    expect(JSON.stringify(log.mock.calls)).not.toContain("password");
  });
});

describe("safe logs, errors and browser requests", () => {
  it("logs only route metadata, not responses, query strings, headers or IDs", async () => {
    const log = vi.fn();
    const app = express();
    app.use(requestMetadataLogger(log));
    app.get("/api/clients/:id", (_req, res) => res.json({ email: "private@example.invalid", key: "test-sensitive" }));
    const url = await serve(app);
    const response = await fetch(`${url}/api/clients/private-id?key=query-secret`, {
      headers: { Authorization: "header-secret" },
    });
    await response.text();
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^GET \/api\/clients\/:id 200 in \d+ms$/));
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/private-id|private@|test-sensitive|query-secret|header-secret/);
  });

  it("redacts internal error details, disables API caching and sets browser headers", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = express();
    app.use(securityHeaders);
    app.get("/api/error", () => { throw new Error("private credential and internal SQL"); });
    app.use(safeErrorHandler);
    const url = await serve(app);
    const response = await fetch(`${url}/api/error`);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Internal server error." });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(JSON.stringify(log.mock.calls)).not.toContain("credential");
  });

  it("blocks cross-site writes but permits same-origin writes", async () => {
    const app = express();
    app.use(sameOriginWrites);
    app.post("/api/write", (_req, res) => res.json({ ok: true }));
    const url = await serve(app);
    expect((await fetch(`${url}/api/write`, {
      method: "POST", headers: { Origin: "https://untrusted.invalid" },
    })).status).toBe(403);
    expect((await fetch(`${url}/api/write`, {
      method: "POST", headers: { "Sec-Fetch-Site": "cross-site" },
    })).status).toBe(403);
    expect((await fetch(`${url}/api/write`, {
      method: "POST", headers: { Origin: url },
    })).status).toBe(200);
  });
});
