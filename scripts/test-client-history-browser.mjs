// Actual-app browser tests with intercepted API fixtures. Never writes live data.
// Run with the dev workflow running and Chromium on PATH.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "client-history-"));
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
  "--remote-debugging-port=9336", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9336/json")).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let id = 0, inventoryFailure = false;
  const pending = new Map(), errors = [], writes = [];
  const clients = [
    { id: 12, name: "Fixture Buyer" }, { id: 13, name: "Fixture Seller" },
    { id: 14, name: "Fixture Both" }, { id: 15, name: "Fixture Empty" },
    { id: 17, name: "Deleted Client Name" },
  ].map(client => ({ ...client, type: "client", isVip: false, createdAt: "2026-01-01",
    email: null, phone: null, country: null, notes: "" }));
  const watch = (id, extra = {}) => ({
    id, brand: "Fixture", model: `Watch-${id}`, referenceNumber: `REF-${id}`,
    purchasePrice: 100000, targetSellPrice: 150000, salePrice: 123456,
    soldDate: "2026-10-21", purchaseDate: "2026-01-01", status: "sold",
    condition: "Good", buyerId: null, clientId: null, box: false, papers: false,
    expenses: [], ...extra,
  });
  const watches = [
    watch(1, { buyerId: 12, clientId: 13, soldTo: "Name before rename" }),
    watch(2, { buyerId: 14, clientId: 14 }),
    watch(3, { soldTo: "Fixture Empty" }), // legacy name-only, not a relationship
    watch(4, { soldTo: "Deleted Client Name" }), // deleted client unlinked
    watch(5, { buyerId: 99, soldTo: "Fixture Buyer" }), // same name, different person
    watch(6, { buyerId: 12, soldDate: null, dateSold: null, salePrice: null }),
    watch(7, { buyerId: 12, salePrice: 0, soldPrice: 987654 }),
    watch(8, { buyerId: 12, status: "in_stock" }), // reversed sale retains its buyer link
    watch(9, { buyerId: 12, salePrice: 0, soldPrice: null }),
  ];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  socket.on("message", async raw => {
    const event = JSON.parse(raw);
    if (event.id) {
      const handler = pending.get(event.id); pending.delete(event.id);
      if (event.error) handler?.reject(new Error(event.error.message)); else handler?.resolve(event.result);
    }
    if (event.method === "Runtime.exceptionThrown") {
      errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    }
    if (event.method !== "Fetch.requestPaused") return;
    const { request, requestId } = event.params;
    const path = new URL(request.url).pathname;
    if (request.method !== "GET") writes.push({ path, method: request.method });
    let data = {}, status = 200;
    if (path === "/api/auth/user") data = { id: "fixture-only", username: "fixture-only" };
    else if (path === "/api/clients") data = clients;
    else if (path === "/api/inventory") {
      data = inventoryFailure ? { message: "Fixture unavailable" } : watches;
      status = inventoryFailure ? 500 : 200;
    } else if (/^\/api\/inventory\/\d+$/.test(path)) data = watches.find(w => w.id === Number(path.split("/").at(-1)));
    else if (path === "/api/expenses") data = [];
    await send("Fetch.fulfillRequest", { requestId, responseCode: status,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(data)).toString("base64") });
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async expression => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await pause(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const open = async clientId => {
    await send("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/clients/${clientId}` });
    await wait(`document.body?.innerText.includes(${JSON.stringify(clientId === 16 ? "Client not found" : inventoryFailure ? "Unable to load client history" : "Watches sold to this client")})`);
  };
  const text = () => evaluate("document.body.innerText");
  const summary = id => evaluate(`document.querySelector('[data-testid="client-summary-${id}"]').innerText`);
  const salesText = () => evaluate("document.querySelector('[data-testid=client-sales-history]').innerText");
  const noOverflow = () => evaluate("document.documentElement.scrollWidth <= innerWidth");
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  for (const [width, height] of [[1440, 1100], [390, 844]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await open(12);
    assert.equal(await summary("purchase-count"), "4");
    assert((await summary("total-spent")).includes("11.111,10"));
    assert.equal(await summary("acquisition-count"), "0");
    assert((await summary("acquisition-value")).includes("0,00"));
    assert((await text()).includes("1 sale amount not recorded; excluded from total."));
    assert((await salesText()).includes("Watch-1"));
    assert((await salesText()).includes("21 Oct 2026"));
    assert((await salesText()).includes("1.234,56"));
    assert((await salesText()).includes("9.876,54"));
    assert((await salesText()).includes("0,00"));
    assert((await salesText()).includes("Not recorded"));
    assert(!(await salesText()).includes("Watch-5"));
    assert(!(await salesText()).includes("Watch-8"));
    assert((await text()).includes("No watches bought from this client yet."));
    assert(await noOverflow(), `Page overflows at ${width}px`);
    if (width < 500) {
      assert(await evaluate(`(() => {
        const scroller = document.querySelector('[data-testid=client-sales-history] table').parentElement;
        scroller.scrollLeft = scroller.scrollWidth;
        const amount = scroller.querySelector('tbody tr td:last-child').getBoundingClientRect();
        const bounds = scroller.getBoundingClientRect();
        const visible = amount.right <= bounds.right + 1 && amount.left >= bounds.left - 1;
        scroller.scrollLeft = 0;
        return visible;
      })()`), "Sale amount can be reached by horizontal scrolling on mobile");
    }
    await evaluate("document.querySelector('[data-testid=client-sales-history]').scrollIntoView({block:'center'})");
    await writeFile(`/tmp/client-history-${width}.jpg`, Buffer.from(
      (await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
    assert.equal(await evaluate("document.querySelector('[data-testid=client-sales-history] a[href=\"/inventory/1\"]').getAttribute('href')"), "/inventory/1");
    await evaluate("document.querySelector('[data-testid=client-sales-history] a[href=\"/inventory/1\"]').click()");
    await wait("location.pathname === '/inventory/1' && document.body?.innerText.includes('Watch-1')");
    await open(13);
    assert.equal(await summary("purchase-count"), "0");
    assert((await summary("total-spent")).includes("0,00"));
    assert.equal(await summary("acquisition-count"), "1");
    assert((await summary("acquisition-value")).includes("1.000,00"));
    assert((await salesText()).includes("No watches sold to this client yet."));
    assert((await text()).includes("Watch-1"));
    await open(14);
    assert.equal(await summary("purchase-count"), "1");
    assert((await summary("total-spent")).includes("1.234,56"));
    assert.equal(await summary("acquisition-count"), "1");
    assert((await summary("acquisition-value")).includes("1.000,00"));
    assert((await salesText()).includes("Watch-2"));
    assert.equal(await evaluate("document.querySelectorAll('a[href=\"/inventory/2\"][data-testid]').length"), 2);
    await open(15);
    assert.equal(await summary("purchase-count"), "0");
    assert.equal(await summary("acquisition-count"), "0");
    assert((await summary("total-spent")).includes("0,00"));
    assert((await text()).includes("No watches sold to this client yet."));
    assert((await text()).includes("No watches bought from this client yet."));
    assert(!(await text()).includes("Watch-3"));
    await open(16);
    assert(!(await text()).includes("Watches sold"));
    await open(17);
    assert((await salesText()).includes("No watches sold to this client yet."));
    assert(!(await text()).includes("Watch-4"));
    inventoryFailure = true;
    await open(12);
    assert(!(await text()).includes("No watches sold"));
    inventoryFailure = false;
  }
  assert.deepEqual(writes, [], "No business data should be written");
  assert.deepEqual(errors, []);
  console.log("PASS: desktop/mobile buyer-only, seller-only, both-role, no-history, deleted-client, same-name and legacy isolation, sale date/amount, missing values, watch links and failed-API state. Browser-only API fixtures; no live accounts or records modified.");
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  await pause(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
