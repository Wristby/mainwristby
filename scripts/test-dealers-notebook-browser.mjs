// Authenticated UI fixture with a stateful mock API. No real accounts, records, or AI calls.
// Run with the development workflow running and Chromium available.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "dealers-notebook-"));
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
  "--remote-debugging-port=9361", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const monthKey = "2026-09";
const previousMonth = month => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
};
const fixtureAction = {
  id: "fb02b69f-a7a7-46d1-bb03-2b144f5d74b1",
  title: "Review sourcing lead times",
  rationale: "Compare recent purchase lead times before changing the sourcing plan.",
  evidenceKeys: ["period_sales"],
  relatedWatches: [],
  status: "open",
  createdAt: "2026-09-30T12:00:00.000Z",
  completedAt: null,
};

function report(overview, generatedAt) {
  const period = {
    monthKeys: [monthKey], label: "September 2026", salesCount: 2, pricedSalesCount: 2,
    revenueCents: 250000, netProfitCents: 42000, marginPercent: 16.8, medianDaysListed: 30,
    daysSampleCount: 2, salesWithPriceHistory: 0, salesWithPriceReductions: 0, priceReductionCount: 0, brands: [],
  };
  return {
    period,
    comparison: {
      ...period, monthKeys: ["2026-08"], label: "August 2026", salesCount: 1, pricedSalesCount: 1,
      revenueCents: 120000, netProfitCents: 18000, marginPercent: 15, medianDaysListed: 35, daysSampleCount: 1,
    },
    currentStock: { activeListings: 0, listedCapitalCents: 0, candidates: [] },
    overview, wins: [], challenges: [], improvements: [],
    recommendations: [{
      id: "fixture-recommendation",
      title: "Review sourcing lead times",
      action: "Compare purchase lead times.",
      rationale: "Use the latest recorded purchases.",
      evidenceKeys: ["period_sales"],
      relatedWatchCodes: [],
      relatedWatches: [],
    }],
    evidence: { period_sales: "2 recorded sales in September 2026" },
    dataCaveats: ["Fixture report for browser testing."],
    generatedAt,
  };
}

let entry = {
  monthKey,
  comparisonMode: "previous-month",
  contextNote: "Initial saved business context.",
  report: report("Previously saved September review.", "2026-10-01T09:00:00.000Z"),
  actions: [structuredClone(fixtureAction)],
  generatedAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
};
const emptyEntry = month => ({
  monthKey: month,
  comparisonMode: "previous-month",
  contextNote: "",
  report: null,
  actions: [],
  generatedAt: null,
  updatedAt: null,
});
const writes = [];
const analyzeRequests = [];
let authUserRequests = 0;
const pending = new Map();
const errors = [];
let socket;
let commandId = 0;

try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9361/json")).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, { resolve, reject, method });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.on("message", async raw => {
    const event = JSON.parse(raw);
    if (event.id) {
      const callback = pending.get(event.id);
      pending.delete(event.id);
      if (event.error) callback?.reject(new Error(`${callback?.method || "CDP command"}: ${event.error.message}`));
      else callback?.resolve(event.result);
    }
    if (event.method === "Runtime.exceptionThrown") {
      errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    }
    if (event.method !== "Fetch.requestPaused") return;

    const { request, requestId } = event.params;
    const path = new URL(request.url).pathname;
    const input = request.postData ? JSON.parse(request.postData) : {};
    let data;
    let status = 200;
    if (request.method !== "GET") writes.push({ method: request.method, path, input });

    if (path === "/api/auth/user") {
      authUserRequests++;
      data = { id: "notebook-browser-fixture", username: "fixture-user" };
    } else if (request.method === "GET" && /^\/api\/dealers-notebook\/\d{4}-(0[1-9]|1[0-2])$/.test(path)) {
      const requestedMonth = path.split("/").at(-1);
      data = {
        entry: structuredClone(requestedMonth === monthKey ? entry : emptyEntry(requestedMonth)),
        previousMonthKey: previousMonth(requestedMonth),
        previousActions: [],
      };
    } else if (path === `/api/dealers-notebook/${monthKey}/context` && request.method === "PUT") {
      entry = { ...entry, contextNote: input.contextNote, updatedAt: new Date().toISOString() };
      data = { entry: structuredClone(entry), previousMonthKey: "2026-08", previousActions: [] };
    } else if (path === `/api/dealers-notebook/${monthKey}/actions` && request.method === "PUT") {
      entry = { ...entry, actions: input.actions, updatedAt: new Date().toISOString() };
      data = { entry: structuredClone(entry), previousMonthKey: "2026-08", previousActions: [] };
    } else if (path === "/api/dealers-notebook/analyze" && request.method === "POST") {
      analyzeRequests.push(input);
      entry = {
        ...entry,
        comparisonMode: input.comparisonMode,
        contextNote: input.contextNote,
        report: report("Mock AI review generated for September.", "2026-10-02T09:00:00.000Z"),
        generatedAt: "2026-10-02T09:00:00.000Z",
        updatedAt: new Date().toISOString(),
      };
      data = { entry: structuredClone(entry), previousMonthKey: "2026-08", previousActions: [] };
    } else {
      console.error(`Fixture has no response for ${request.method} ${path}`);
      data = { message: "Fixture record not found" };
      status = 404;
    }

    await send("Fetch.fulfillRequest", {
      requestId,
      responseCode: status,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(data)).toString("base64"),
    });
  });

  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let i = 0; i < 120; i++) {
      if (await evaluate(expression)) return;
      await pause(100);
    }
    throw new Error(`Timed out waiting for ${label}; page=${await evaluate("document.body.innerText.slice(-1800)")}; errors=${errors}`);
  };
  const click = async text => {
    await evaluate(`(() => {
      const button = [...document.querySelectorAll("button")].find(el => el.textContent.trim() === ${JSON.stringify(text)});
      if (!button) throw new Error("Missing button: " + ${JSON.stringify(text)});
      button.click();
    })()`);
  };
  const fill = async (selector, value) => {
    await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error("Missing field: " + ${JSON.stringify(selector)});
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
  };
  const selectSavedMonth = async () => {
    await wait("!!document.querySelector('input[aria-label=\"Review month\"]')", "review month control");
    await fill('input[aria-label="Review month"]', monthKey);
    await wait("document.querySelector('main')?.innerText.includes('Previously saved September review.') || document.querySelector('main')?.innerText.includes('Mock AI review generated for September.')", "saved September report");
  };
  const reloadAndSelectSavedMonth = async () => {
    const priorAuthRequests = authUserRequests;
    await send("Page.reload");
    for (let i = 0; i < 120 && authUserRequests === priorAuthRequests; i++) await pause(100);
    assert(authUserRequests > priorAuthRequests, "page reload should request the signed-in user again");
    await selectSavedMonth();
  };
  const base = "http://127.0.0.1:5000";
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${base}/dealers-notebook` });
  await wait("document.querySelector('main')?.innerText.includes('Dealer’s Notebook')", "signed-in notebook page");

  await selectSavedMonth();
  assert.equal(await evaluate('document.querySelector(\'textarea[aria-label="Business context note"]\')?.value'), "Initial saved business context.");

  const savedNote = "Supply delays reduced available sourcing time.";
  await fill('textarea[aria-label="Business context note"]', savedNote);
  await click("Save context");
  await wait("document.querySelector('[role=status]')?.innerText.includes('Business context saved.')", "context save confirmation");
  assert.equal(entry.contextNote, savedNote);

  await click("Mark done");
  await wait("document.querySelector('[role=status]')?.innerText.includes('Action marked done.')", "action status save confirmation");
  assert.equal(entry.actions[0].status, "done");
  assert(entry.actions[0].completedAt, "completed action should have a completion timestamp");

  await reloadAndSelectSavedMonth();
  assert.equal(await evaluate('document.querySelector(\'textarea[aria-label="Business context note"]\')?.value'), savedNote);
  await evaluate("(() => { const details=[...document.querySelectorAll('details')].find(el=>el.querySelector('summary')?.innerText.includes('Completed or dismissed')); if(details) details.open=true; })()");
  await wait("[...document.querySelectorAll('details')].some(el=>el.querySelector('summary')?.innerText.includes('Completed or dismissed') && el.innerText.includes('Done'))", "completed action after reload");

  await click("Refresh review");
  await wait("document.querySelector('main')?.innerText.includes('Mock AI review generated for September.')", "mock report generation");
  assert.equal(analyzeRequests.length, 1, "report generation should make one analysis request");
  assert.deepEqual(Object.keys(analyzeRequests[0]).sort(), ["comparisonMode", "contextNote", "monthKey"]);
  assert.equal(analyzeRequests[0].monthKey, monthKey);
  assert.equal(analyzeRequests[0].contextNote, savedNote);
  const analysisPayload = JSON.stringify(analyzeRequests[0]).toLowerCase();
  for (const sensitiveValue of ["buyer@example.invalid", "+31 6 12345678", "fixture-serial", "fixture-tracking"]) {
    assert(!analysisPayload.includes(sensitiveValue), `analysis request must not include ${sensitiveValue}`);
  }
  assert.equal(entry.actions[0].status, "done", "report regeneration should preserve the saved action status");

  await reloadAndSelectSavedMonth();
  assert.equal(await evaluate('document.querySelector(\'textarea[aria-label="Business context note"]\')?.value'), savedNote);
  await evaluate("(() => { const details=[...document.querySelectorAll('details')].find(el=>el.querySelector('summary')?.innerText.includes('Completed or dismissed')); if(details) details.open=true; })()");
  await wait("[...document.querySelectorAll('details')].some(el=>el.querySelector('summary')?.innerText.includes('Completed or dismissed') && el.innerText.includes('Done'))", "action status after report reload");

  assert(writes.some(write => write.path.endsWith("/context") && write.method === "PUT"), "context should be saved through its API");
  assert(writes.some(write => write.path.endsWith("/actions") && write.method === "PUT"), "actions should be saved through their API");
  assert(writes.some(write => write.path.endsWith("/analyze") && write.method === "POST"), "report should be generated through its API");
  assert.deepEqual(errors, []);
  console.log("PASS: authenticated notebook UI loads a saved month, saves notes and action status across reloads, generates a mocked report, and sends no contact fields in the analysis request. All APIs are fixtures; no live auth, database, contacts, or Gemini calls.");
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  await pause(250);
  await rm(profile, { recursive: true, force: true });
}
