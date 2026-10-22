// Browser-only API fixtures. No live accounts, customer records, or databases are changed.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "client-backfill-"));
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=9342", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
// Run against the local dev server: the public preview domain may show a
// platform sharing interstitial before the application can load.
const origin = "http://127.0.0.1:5000";
let socket;
try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9342/json")).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let sequence = 0, failSync = false, failResolve = false;
  const pending = new Map(), errors = [], actions = [], unexpectedWrites = [];
  const contacts = [{ id: 1, name: "Alex Example", email: "saved@example.invalid", phone: "+31 1234", country: "Netherlands", type: "client", isVip: true }];
  const watches = [
    { id: 10, soldTo: "Taylor Fixture", buyerId: null },
    { id: 11, soldTo: "Alex Example", buyerId: null },
    { id: 12, soldTo: "Sam Fixture", buyerId: null },
    { id: 13, soldTo: "Sam Fixture", buyerId: null },
  ].map(watch => ({ ...watch, brand: "Cartier", model: "Tank", referenceNumber: `TEST-${watch.id}` }));
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.on("message", async raw => {
    const event = JSON.parse(raw);
    if (event.id) {
      const request = pending.get(event.id); pending.delete(event.id);
      if (event.error) request?.reject(new Error(event.error.message)); else request?.resolve(event.result);
    }
    if (event.method === "Runtime.exceptionThrown") errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    if (event.method !== "Fetch.requestPaused") return;
    const { request, requestId } = event.params, path = new URL(request.url).pathname;
    let data = {}, code = 200;
    if (path === "/api/auth/user") data = { id: 999, username: "fixture-only" };
    else if (path === "/api/clients" && request.method === "GET") data = contacts;
    else if (path === "/api/inventory") data = watches;
    else if (path === "/api/settings") data = {};
    else if (path === "/api/retention/schedule") data = null;
    else if (path === "/api/retention/holds") data = [];
    else if (path === "/api/clients/watch-buyers/sync" && request.method === "POST") {
      if (failSync) { code = 503; data = { message: "Fixture sync failure" }; }
      else {
        let created = 0;
        if (watches[0].buyerId == null) {
          contacts.push({ id: 2, name: watches[0].soldTo, type: "client", isVip: false });
          watches[0].buyerId = 2; created = 1;
        }
        data = { created, pending: watches.filter(watch => watch.buyerId == null).map(watch => ({
          watch, name: watch.soldTo,
          matches: contacts.filter(client => client.name === watch.soldTo),
          repeatedName: watches.some(other => other.id !== watch.id && other.buyerId == null && other.soldTo === watch.soldTo),
        })) };
      }
    } else if (path === "/api/clients/watch-buyers/resolve" && request.method === "POST") {
      const input = JSON.parse(request.postData);
      actions.push(input);
      if (failResolve) { code = 503; data = { message: "Fixture review failure" }; }
      else {
        const watch = watches.find(watch => watch.id === input.watchId);
        if (input.action === "create") {
          const clientId = Math.max(...contacts.map(client => client.id)) + 1;
          contacts.push({ id: clientId, name: input.expectedName, type: "client", isVip: false });
          watch.buyerId = clientId;
        } else watch.buyerId = input.clientId;
        data = { watchId: watch.id, clientId: watch.buyerId };
      }
    } else if (request.method !== "GET") unexpectedWrites.push(path);
    await send("Fetch.fulfillRequest", { requestId, responseCode: code, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(data)).toString("base64") });
  });
  const evaluate = async expression => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timeout: ${label}; page=${await evaluate("document.body.innerText.slice(0,1800)")}; errors=${JSON.stringify(errors)}`);
  };
  const click = expression => evaluate(`(${expression}).click()`);
  const actionButton = (id, text) => `Array.from(document.querySelectorAll('[data-testid="buyer-review-${id}"] button')).find(el=>el.textContent===${JSON.stringify(text)})`;
  const choose = (watchId, clientId) => evaluate(`(() => {const el=document.querySelector('#buyer-client-${watchId}');el.value='${clientId}';el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const refresh = () => click(`Array.from(document.querySelectorAll('section[aria-labelledby="watch-buyer-sync-title"] button')).find(el=>el.textContent==='Refresh')`);

  await send("Runtime.enable"); await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 950, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${origin}/clients` });
  await wait("!!document.querySelector('[data-testid=\"buyer-review-11\"]')");
  await wait("document.querySelector('table').innerText.includes('Taylor Fixture')", "automatic import appears in Clients table");
  assert.equal(contacts.length, 2);
  assert.equal(await evaluate("document.querySelector('#buyer-client-11').value"), "", "never preselect a possible match");
  assert.equal(await evaluate(`${actionButton(11, "Link selected Client")}.disabled`), true);
  await writeFile("/tmp/client-backfill-desktop.jpg", Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth"), false, "mobile review does not overflow");
  await writeFile("/tmp/client-backfill-mobile.jpg", Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
  failResolve = true;
  await choose(11, 1); await click(actionButton(11, "Link selected Client"));
  await wait("document.body.innerText.includes('Fixture review failure')");
  assert.equal(watches[1].buyerId, null);
  failResolve = false;
  await wait(`!(${actionButton(11, "Link selected Client")}).disabled`);
  await click(actionButton(11, "Link selected Client"));
  await wait("!document.querySelector('[data-testid=\"buyer-review-11\"]')", "explicit link removes review item");
  assert.equal(watches[1].buyerId, 1);
  assert.equal(contacts[0].email, "saved@example.invalid");
  assert.equal(contacts.length, 2, "linking must not create a duplicate");

  await click(actionButton(12, "Create separate Client"));
  await wait("!document.querySelector('[data-testid=\"buyer-review-12\"]')");
  await wait("document.querySelector('#buyer-client-13').innerText.includes('Possible match: Sam Fixture')");
  assert.equal(watches[3].buyerId, null, "repeated name is not linked implicitly");
  await choose(13, 3); await click(actionButton(13, "Link selected Client"));
  await wait("!document.querySelector('[data-testid=\"buyer-review-13\"]')");
  await wait("document.querySelector('table').innerText.includes('Sam Fixture')");
  assert.equal(contacts.length, 3);

  failSync = true; await refresh();
  await wait("document.body.innerText.includes('Fixture sync failure')");
  assert.equal(await evaluate("document.querySelector('table').innerText.includes('Taylor Fixture')"), true);
  failSync = false; await refresh();
  await wait("!document.body.innerText.includes('Fixture sync failure')");
  await send("Page.navigate", { url: `${origin}/clients` });
  await wait("!!document.querySelector('table') && document.querySelector('table').innerText.includes('Sam Fixture')");
  assert.equal(contacts.length, 3, "revisiting Clients creates no duplicates");
  assert(actions.some(action => action.action === "create"));
  assert(actions.some(action => action.action === "link"));
  assert.deepEqual(unexpectedWrites, []);
  assert.deepEqual(errors, []);
  console.log("PASS: historical buyer auto-import display, no automatic name links, explicit linking/separate creation, repeated-name review, retry/error handling, preserved contacts, refresh idempotence, and mobile layout. Browser-only API fixtures; no live records changed.");
} finally {
  socket?.close(); chrome.kill("SIGTERM"); await pause(200);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
