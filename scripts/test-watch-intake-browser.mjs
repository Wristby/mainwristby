// Browser-only API fixtures: never signs into or writes to the real database.
// Run with the development workflow running: node scripts/test-watch-intake-browser.mjs
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "intake-browser-"));
const port = 9333;
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let id = 0;
  let failNextSave = false;
  const pending = new Map();
  const errors = [], posts = [], createdWatches = [], clientPosts = [];
  const sellers = [{ id: 12, name: "Fixture dealer", type: "dealer",
    email: "saved@example.invalid", phone: "+31 6 1234", country: "Netherlands", notes: "Preserve", isVip: true }];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  socket.on("message", async raw => {
    const message = JSON.parse(raw);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request?.reject(new Error(message.error.message)); else request?.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.method !== "Fetch.requestPaused") return;
    const { requestId, request } = message.params;
    const path = new URL(request.url).pathname;
    let data = {}, status = 200;
    if (path === "/api/auth/user") data = { id: 999, username: "fixture-only" };
    else if (path === "/api/inventory") {
      if (request.method === "POST") {
        posts.push(JSON.parse(request.postData)); status = 201;
        data = { ...posts.at(-1), id: 9000 };
        if (failNextSave) { status = 500; data = { message: "Fixture save failed; retry" }; failNextSave = false; }
        else {
          const buyer = posts.at(-1).saleBuyer;
          if (buyer?.mode === "new" && sellers.some(client =>
            (buyer.email && client.email?.toLowerCase() === buyer.email.toLowerCase())
            || (buyer.phone && client.phone?.replace(/\D/g, "") === buyer.phone.replace(/\D/g, "")))) {
            status = 409; data = { message: "A client with this email or phone already exists. Choose them using Existing client." };
          } else {
            let client;
            if (buyer?.mode === "new") {
              client = { id: 100 + sellers.length, ...buyer, type: "client",
                email: buyer.email || null, phone: buyer.phone || null, country: buyer.country || null };
              sellers.push(client);
            } else if (buyer?.mode === "existing") client = sellers.find(c => c.id === buyer.clientId);
            data = { ...data, buyerId: client?.id || null, soldTo: client?.name || null };
            createdWatches.push(data);
          }
        }
        await pause(600);
      } else data = [];
    } else if (path === "/api/clients") {
      if (request.method === "POST") {
        clientPosts.push(JSON.parse(request.postData));
        data = { ...JSON.parse(request.postData), id: 14 }; sellers.push(data); status = 201;
      } else data = sellers;
    }
    await send("Fetch.fulfillRequest", { requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(data)).toString("base64") });
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, message = expression) => {
    for (let i = 0; i < 120; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timeout: ${message}; body=${await evaluate("document.body.innerText.slice(-1600)")}`);
  };
  const click = async text => {
    await evaluate(`(() => {const element=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!element)throw Error('No button '+${JSON.stringify(text)});element.click()})()`);
    await pause(120);
  };
  const step = async index => {
    await evaluate(`document.querySelectorAll('nav[aria-label="Watch intake sections"] button')[${index}].click()`);
    await pause(120);
  };
  const input = async (name, value) => {
    const selector = name.startsWith("#") ? name : `[name="${name}"]`;
    await evaluate(`(() => {const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing ${name}');const set=Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
    await pause(70);
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const domain = process.env.REPLIT_DEV_DOMAIN;
  assert(domain, "REPLIT_DEV_DOMAIN is required");
  const base = `https://${domain}`;
  await send("Page.navigate", { url: `${base}/inventory` });
  await wait(`!!document.querySelector('[data-testid="button-add-watch"]')`);
  await click("Add Watch");
  await wait(`!!document.querySelector('#intake-model')`);
  assert.equal(await evaluate(`document.querySelectorAll('nav[aria-label="Watch intake sections"] button').length`), 5);
  await step(4); await click("Add watch");
  await wait(`document.activeElement?.name==='brand'`, "validation focuses first hidden required field");
  await input("brand", "Rolex");
  await evaluate(`document.querySelector('[name="model"]').focus()`);
  // Individual keystrokes catch remount/focus-loss regressions, unlike setting a value once.
  for (const letter of "Browser Explorer") await send("Input.insertText", { text: letter });
  assert.equal(await evaluate(`document.activeElement?.name`), "model");
  assert.equal(await evaluate(`document.querySelector('[name="model"]').value`), "Browser Explorer");
  await input("referenceNumber", "TEST124270");
  await input("linkCount", 11);
  await step(1);
  await input("purchasedFrom", "Dealer"); await input("paidWith", "Wire"); await input("purchasePrice", 5123.45);
  await step(4); await click("Add watch");
  await wait(`document.activeElement?.name==='clientId'`, "dealer is required");
  await click("New seller");
  await wait(`!!document.querySelector('#seller-name')`);
  await evaluate(`(() => {const el=document.querySelector('#seller-name');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'Fixture new seller');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`document.querySelector('#seller-name').closest('form').requestSubmit()`);
  await wait(`!document.querySelector('#seller-name')`);
  await wait(`document.querySelector('[name="clientId"]')?.value==='14'`, "new seller selected");
  assert.equal(posts.length, 0, "quick seller must not submit watch");
  await step(2);
  await click("Add details");
  await input("serviceFee", 125.75); await input("serviceNotes", "In-house adjustment");
  await click("Hide details"); await click("Add details");
  assert.equal(await evaluate(`document.querySelector('[name="serviceFee"]').value`), "125.75");
  await step(3);
  await input("status", "sold");
  await input("targetSellPrice", 7000.12); await input("salePrice", 7000.51); await input("soldPlatform", "Chrono24");
  await input("dateSold", "2026-10-17");
  await input("#sale-buyer-name", "Intake Email Buyer");
  await input("#sale-buyer-email", "intake@example.invalid");
  await input("notes", "Fixture only");
  // Only shipping's Add details remains after sold status expands sale details.
  await click("Add details"); await input("trackingNumber", "FIXTURE-TRACK");
  await step(4);
  await wait(`document.body.innerText.includes('FIXTURE-TRACK')`);
  assert((await evaluate("document.body.innerText")).includes("Fixture new seller"));
  const desktopShot = await send("Page.captureScreenshot", { format: "jpeg", quality: 75 });
  await writeFile("/tmp/watch-intake-desktop.jpg", Buffer.from(desktopShot.data, "base64"));
  await evaluate(`(() => {const button=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Add watch');button.click();button.click()})()`);
  await wait(`!document.querySelector('nav[aria-label="Watch intake sections"]')`, "successful submit closes");
  assert.equal(posts.length, 1);
  assert.equal(posts[0].purchasePrice, 512345);
  assert.equal(posts[0].serviceFee, 12575);
  assert.equal(posts[0].targetSellPrice, 700012);
  assert.equal(posts[0].platformFees, 45503);
  assert.equal(posts[0].linkCount, 11);
  assert.equal(posts[0].dateSold, posts[0].soldDate);
  assert.equal(posts[0].trackingNumber, "FIXTURE-TRACK");
  assert.equal(posts[0].clientId, 14, "buyer must not replace seller");
  assert.equal(createdWatches[0].soldTo, "Intake Email Buyer");
  assert.equal(sellers.at(-1).phone, null);
  assert.equal(sellers.at(-1).email, "intake@example.invalid");
  await click("Add Watch");
  await wait(`!!document.querySelector('#intake-model')`);
  assert.equal(await evaluate(`document.querySelector('#intake-model').value`), "");
  await input("model", "Unsaved test");
  let acceptDiscard = false;
  socket.on("message", raw => {
    const event = JSON.parse(raw);
    if (event.method === "Page.javascriptDialogOpening") void send("Page.handleJavaScriptDialog", { accept: acceptDiscard });
  });
  await evaluate(`document.querySelector('[aria-label="Close intake"]').click()`);
  assert.equal(await evaluate(`document.querySelector('#intake-model')?.value`), "Unsaved test");
  acceptDiscard = true;
  await evaluate(`document.querySelector('[aria-label="Close intake"]').click()`);
  await wait(`!document.querySelector('#intake-model')`);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: `${base}/` });
  await wait(`!![...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Add Watch')`);
  await click("Add Watch");
  await wait(`!!document.querySelector('#intake-model')`);
  assert.equal(await evaluate(`document.querySelector('#intake-model').value`), "");
  const overflow = await evaluate(`document.documentElement.scrollWidth > window.innerWidth`);
  assert.equal(overflow, false, "mobile page should not overflow horizontally");
  await input("model", "Mobile fixture");
  await click("Next"); await click("Back");
  assert.equal(await evaluate(`document.querySelector('#intake-model').value`), "Mobile fixture");
  const mobileShot = await send("Page.captureScreenshot", { format: "jpeg", quality: 80 });
  await writeFile("/tmp/watch-intake-mobile.jpg", Buffer.from(mobileShot.data, "base64"));
  await step(4);
  const rect = await evaluate(`(() => {const el=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Add watch');const r=el.getBoundingClientRect();return {bottom:r.bottom,top:r.top,height:window.innerHeight}})()`);
  assert(rect.top >= 0 && rect.bottom <= rect.height, "mobile footer must be reachable");
  await step(0); await input("brand", "Rolex"); await input("referenceNumber", "MOBILE-TEST");
  await step(1); await input("purchasedFrom", "Private Purchase"); await input("paidWith", "Debit"); await input("purchasePrice", 2450.19);
  await step(3); await input("status", "sold");
  await input("#sale-buyer-email", "invalid");
  await step(4); await click("Add watch");
  await wait(`document.querySelector('fieldset')?.innerText.includes('Buyer name is required')`);
  assert.equal(posts.length, 1, "validation prevents requests");
  await input("#sale-buyer-name", "Mobile buyer"); await step(4); await click("Add watch");
  await wait(`document.querySelector('fieldset')?.innerText.includes('Enter a valid buyer email')`);
  assert.equal(posts.length, 1);
  await input("#sale-buyer-email", "SAVED@example.invalid");
  await step(4); await click("Add watch");
  await wait(`document.querySelector('[role=alert]')?.innerText.includes('already exists')`);
  assert.equal(createdWatches.length, 1);
  assert.equal(sellers.length, 3);
  await step(3); await input("#sale-buyer-email", "mobile@example.invalid"); await input("#sale-buyer-phone", "+31 6 9999"); await input("#sale-buyer-country", "Belgium");
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').scrollWidth > document.querySelector('[role=dialog]').clientWidth`), false);
  await step(4);
  failNextSave = true;
  await click("Add watch");
  await wait(`document.body.innerText.includes('Fixture save failed; retry')`, "failed save shows a recoverable error");
  await step(0);
  assert.equal(await evaluate(`document.querySelector('#intake-model').value`), "Mobile fixture", "failed save retains input");
  await step(3);
  assert.equal(await evaluate(`document.querySelector('#sale-buyer-phone').value`), "+31 6 9999");
  assert.equal(sellers.length, 3, "failed creation must not add a Client");
  assert.equal(createdWatches.length, 1, "failed creation must not add a watch");
  await step(4); await click("Add watch");
  await wait(`!document.querySelector('nav[aria-label="Watch intake sections"]')`);
  assert.equal(posts.length, 4);
  assert.equal(posts.at(-1).purchasePrice, 245019);
  assert.equal(posts.at(-1).model, "Mobile fixture");
  assert.equal(createdWatches.length, 2);
  assert.equal(sellers.at(-1).country, "Belgium");
  const fillWatch = async () => {
    await click("Add Watch"); await wait(`!!document.querySelector('#intake-model')`);
    await input("brand", "Rolex"); await input("model", "Buyer fixture"); await input("referenceNumber", "BUYER-TEST");
    await step(1); await input("purchasedFrom", "Dealer"); await input("clientId", 12);
    await input("paidWith", "Wire"); await input("purchasePrice", 1234.56);
    await step(3); await input("status", "sold");
  };
  const saveWatch = async () => {
    await step(4); await click("Add watch");
    await wait(`!document.querySelector('nav[aria-label="Watch intake sections"]')`);
  };
  await fillWatch();
  await evaluate(`document.querySelector('#sale-existing-client').click()`);
  await step(4); await click("Add watch");
  await wait(`document.querySelector('fieldset')?.innerText.includes('Choose an existing client')`);
  const original = structuredClone(sellers[0]);
  await input("#sale-buyer-search", "3161234");
  await evaluate(`document.querySelector('#sale-buyer-search').focus()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait(`document.querySelector('fieldset').innerText.includes('Existing client: Fixture dealer')`);
  assert.equal(await evaluate(`!!document.querySelector('fieldset .text-emerald-800 svg')`), true, "existing buyer has a checkmark");
  await saveWatch();
  assert.deepEqual(sellers[0], original);
  assert.equal(createdWatches.at(-1).buyerId, 12); assert.equal(createdWatches.at(-1).clientId, 12);
  for (const extra of [{}, { phone: "+31 6 8888" }, { country: "France" }]) {
    await fillWatch(); await input("#sale-buyer-name", "Name shared by different buyers");
    for (const [field, value] of Object.entries(extra)) await input(`#sale-buyer-${field}`, value);
    await saveWatch();
    assert.equal(createdWatches.at(-1).soldTo, "Name shared by different buyers");
    assert.equal(createdWatches.at(-1).clientId, 12);
    assert.equal(sellers.at(-1).email, null);
  }
  assert.equal(clientPosts.length, 1, "only explicit seller quick-add may POST a Client separately");
  assert.deepEqual(errors, [], "no browser JS exceptions");
  console.log("PASS: sold intake name-only and optional contacts; existing buyer keyboard search/checkmark; seller preservation; no profile overwrite; validation; duplicate conflicts; failure rollback/retention/retry; desktop/mobile, original shortcuts and intake navigation. API fully mocked; no live account or data changes.");
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  await pause(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
