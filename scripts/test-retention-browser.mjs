// Browser-only API fixtures: no sign-in bypass or writes to the real database.
// Run with the development workflow running and Chromium available.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "retention-browser-"));
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage",
  "--remote-debugging-port=9348", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9348/json")).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let id = 0, schedule = null, cleared = false, staleOnce = true, version = 1;
  const pending = new Map(), errors = [], writes = [];
  let holds = [];
  const clients = [{ id: 1, name: "Retention Fixture", type: "client", isVip: false,
    email: "fixture@example.invalid", createdAt: "2020-01-01" }];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  socket.on("message", async raw => {
    const event = JSON.parse(raw);
    if (event.id) {
      const callback = pending.get(event.id); pending.delete(event.id);
      if (event.error) callback?.reject(new Error(event.error.message)); else callback?.resolve(event.result);
    }
    if (event.method === "Runtime.exceptionThrown") errors.push(event.params.exceptionDetails.text);
    if (event.method !== "Fetch.requestPaused") return;
    const { request, requestId } = event.params;
    const path = new URL(request.url).pathname;
    const input = request.postData ? JSON.parse(request.postData) : {};
    if (request.method !== "GET") writes.push({ path, input });
    let data = [], status = 200;
    if (path === "/api/auth/user") data = { id: "browser-fixture", username: "fixture" };
    else if (path === "/api/clients") data = clients;
    else if (path === "/api/settings") data = {};
    else if (path === "/api/retention/schedule") {
      if (request.method === "PUT") schedule = { ...input, revision: "fixture-revision", approvedAt: input.confirmApproval ? new Date().toISOString() : null, automaticDeletionEnabled: false };
      data = schedule;
    } else if (path === "/api/retention/holds") {
      if (request.method === "POST") { holds.push({ ...input, id: 1 }); version++; }
      data = holds;
    } else if (path.endsWith("/release")) { holds = []; version++; data = { released: true }; }
    else if (path.endsWith("/preview")) {
      const blockers = cleared ? ["Optional profile details have already been cleared."] : holds.length ? ["An active legal hold prevents cleanup."] : schedule?.approvedAt ? [] : ["Approval required."];
      data = { clientId: 1, eligible: !blockers.length, blockers, clear: ["name", "email", "notes"],
        retain: ["Buyer and seller names in transaction records.", "Financial records and expenses."],
        holds, categories: ["optional_profile", "financial", "warranty"].map(category => ({
          category, trigger: category === "optional_profile" ? "last_activity" : category === "financial" ? "financial_year_end" : "delivery",
          eligibleAfter: "2020-01-01T00:00:00Z", action: category === "optional_profile" ? "Clear profile only." : "Retain for review.",
        })), linkedWatchIds: [11], expenseCount: 1, fingerprint: String(version).padStart(64, "0") };
    } else if (path.endsWith("/clear")) {
      if (staleOnce) { staleOnce = false; version++; status = 409; data = { message: "Records changed. Refresh and review the preview again." }; }
      else {
        assert.equal(input.fingerprint, String(version).padStart(64, "0"));
        cleared = true; clients[0].name = "Cleared client #1"; data = { cleared: true };
      }
    }
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
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timed out: ${expression}`);
  };
  const click = text => evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)}).click()`);
  const fill = (selector, value) => evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await send("Runtime.enable"); await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/clients` });
  await wait("document.body?.innerText.includes('Retention safeguards')");
  assert(await evaluate("Array.from(document.querySelectorAll('input[type=number]')).every(e => e.value === '')"), "Periods must start unset");
  for (const [category, days] of [["optional_profile", "0"], ["financial", "2700"], ["warranty", "365"]]) {
    await fill(`#purpose-${category}`, "Fixture approved purpose");
    await fill(`input[aria-label="${category === "optional_profile" ? "Optional profile" : category === "financial" ? "Financial records" : "Warranty records"} retention days"]`, days);
  }
  await fill("#backup-expiry", "45");
  await fill("#backup-procedure", "Verified host expiry and isolated restoration with clearance ledger.");
  await fill("#owner-approval", "Owner document reference");
  await fill("#adviser-approval", "Adviser document reference");
  await evaluate("document.querySelector('#backup-verified').click(); document.querySelector('#confirm-approval').click()");
  await fill("#purpose-financial", "Changed approved purpose");
  assert.equal(await evaluate("document.querySelector('#confirm-approval').getAttribute('data-state')"), "unchecked");
  await evaluate("document.querySelector('#confirm-approval').click()");
  await click("Save schedule");
  await wait("document.body.innerText.includes('Approval recorded')");
  assert.equal(schedule.rules.optional_profile.days, 0);
  assert.equal(schedule.automaticDeletionEnabled, false);
  await evaluate("document.querySelector('button[aria-label=\"Privacy preview and optional cleanup for client 1\"]').click()");
  await wait("document.body.innerText.includes('Optional profile cleanup is eligible')");
  await fill('input[aria-label="Reason for placing legal hold"]', "Fixture pending dispute");
  await click("Place client hold");
  await wait("document.body.innerText.includes('An active legal hold prevents cleanup.')");
  await fill('input[aria-label="Reason for releasing legal hold"]', "Fixture dispute resolved");
  await evaluate("document.querySelector('button[aria-label=\"Release Client #1 legal hold\"]').click()");
  await wait("document.body.innerText.includes('Optional profile cleanup is eligible')");
  await evaluate("document.querySelector('#clear-confirm-1').click()");
  await click("Clear optional profile"); await click("Confirm and clear");
  await wait("document.body.innerText.includes('Records changed.')");
  assert.equal(await evaluate("document.querySelector('#clear-confirm-1').getAttribute('data-state')"), "unchecked");
  await evaluate("document.querySelector('#clear-confirm-1').click()");
  await click("Clear optional profile"); await click("Confirm and clear");
  await wait("document.body.innerText.includes('already been cleared')");
  assert(cleared);
  await send("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/clients` });
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait("document.body?.innerText.includes('Retention safeguards')");
  assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile page must not overflow");
  assert.deepEqual(errors, []);
  assert.equal(writes.filter(w => w.path.endsWith("/clear")).length, 2);
  console.log("Retention browser fixtures passed: unset periods, reapproval, holds, stale preview, manual clearance, mobile layout.");
} finally {
  socket?.close(); chrome.kill();
  await pause(200); await rm(profile, { recursive: true, force: true });
}
