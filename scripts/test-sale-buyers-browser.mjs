// Actual-app UI with browser-only API fixtures. No accounts or live records are changed.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "sale-buyers-"));
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=9335", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9335/json")).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let id = 0, failSave = false;
  const pending = new Map(), errors = [], writes = [];
  const clients = [
    { id: 12, name: "Saved Buyer", email: "saved@example.invalid", phone: "+31 6 1234", country: "Netherlands", type: "client", notes: "Do not change", isVip: true },
    { id: 91, name: "Fixture Seller", email: "seller@example.invalid", type: "dealer", notes: "", isVip: false },
  ];
  let watch = { id: 11, brand: "Rolex", model: "Fixture watch", referenceNumber: "124270", serialNumber: "FIXTURE-ONLY",
    condition: "Good", status: "sold", purchasePrice: 100000, targetSellPrice: 170000, salePrice: 180000,
    soldTo: "Historical name", buyerId: null, clientId: 91, box: true, papers: true, year: 2023,
    purchaseDate: "2026-01-01T12:00:00.000Z", soldDate: "2026-10-01T12:00:00.000Z", dateSold: "2026-10-01T12:00:00.000Z",
    dateListed: "2026-09-01T12:00:00.000Z", purchasedFrom: "Dealer", paidWith: "Debit", expenses: [], notes: "" };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params }));
  });
  socket.on("message", async raw => {
    const event = JSON.parse(raw);
    if (event.id) {
      const handler = pending.get(event.id); pending.delete(event.id);
      if (event.error) handler?.reject(new Error(event.error.message)); else handler?.resolve(event.result);
    }
    if (event.method === "Runtime.exceptionThrown") errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    if (event.method !== "Fetch.requestPaused") return;
    const { request, requestId } = event.params, path = new URL(request.url).pathname;
    let data = {}, status = 200;
    if (request.method !== "GET") writes.push({ path, method: request.method, body: JSON.parse(request.postData || "{}") });
    if (path === "/api/auth/user") data = { id: "fixture-only", username: "fixture-only" };
    else if (path === "/api/settings") data = {};
    else if (path === "/api/inventory") data = [watch];
    else if (path === "/api/clients") data = clients;
    else if (path.startsWith("/api/clients/")) data = clients.find(client => client.id === Number(path.split("/").at(-1)));
    else if (path === "/api/clients/watch-buyers/sync") data = { created: 0, pending: [] };
    else if (path === "/api/retention/schedule") data = null;
    else if (path === "/api/retention/holds") data = [];
    else if (path === "/api/retention/inventory/11/parties") data = [];
    else if (path === "/api/inventory/11") {
      if (request.method === "PUT") {
        const { saleBuyer, ...updates } = writes.at(-1).body;
        await pause(200);
        if (failSave) { failSave = false; status = 500; data = { message: "Fixture save failed; retry" }; }
        else if (saleBuyer?.mode === "new" && clients.some(client => client.email && client.email.toLowerCase() === saleBuyer.email?.toLowerCase())) {
          status = 409; data = { message: "A client with this email already exists. Choose Existing client." };
        } else {
          let buyer;
          if (saleBuyer?.mode === "new") {
            buyer = { id: Math.max(...clients.map(client => client.id)) + 1, ...saleBuyer, type: "client",
              email: saleBuyer.email || null, phone: saleBuyer.phone || null, country: saleBuyer.country || null };
            clients.push(buyer);
          } else if (saleBuyer?.mode === "existing") buyer = clients.find(client => client.id === saleBuyer.clientId);
          watch = { ...watch, ...updates, ...(buyer ? { buyerId: buyer.id, soldTo: buyer.name } : {}),
            ...(saleBuyer?.mode === "none" ? { buyerId: null, soldTo: null } : {}) };
          data = watch;
        }
      } else data = watch;
    } else if (path === "/api/expenses") data = [];
    if (data === undefined) { console.error(`Fixture has no response for ${request.method} ${path}`); data = { message: "Fixture record not found" }; status = 404; }
    await send("Fetch.fulfillRequest", { requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(data)).toString("base64") });
  });
  const evaluate = async expression => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timeout: ${label}; body=${await evaluate("document.body.innerText.slice(-1400)")}; errors=${errors}`);
  };
  const click = async text => {
    await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing '+${JSON.stringify(text)});b.click(); })()`);
    await pause(100);
  };
  const input = async (selector, value) => {
    await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');e.focus();Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await pause(70);
  };
  const edit = async () => { await click("Edit"); await wait("!!document.querySelector('#sale-existing-client')"); };
  const save = async () => { await click("Save Changes"); await wait("!document.querySelector('[role=dialog]')", "sale saves and editor closes"); };
  const newBuyer = async () => {
    if (await evaluate("document.querySelector('#sale-existing-client').getAttribute('aria-checked')==='true'")) {
      await evaluate("document.querySelector('#sale-existing-client').click()"); await pause(100);
    }
  };
  // Use the local dev origin; public preview domains may show a sharing interstitial.
  const base = "http://127.0.0.1:5000";
  await send("Runtime.enable"); await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${base}/inventory/11` });
  await wait("document.querySelector('main')?.innerText.includes('Historical name')");
  await edit(); await input('[name="notes"]', "Legacy sale note"); await save();
  assert.equal(writes.at(-1).body.saleBuyer, undefined); assert.equal(clients.length, 2);
  await edit(); await input("#sale-buyer-name", "Email only Buyer"); await input("#sale-buyer-email", "email-only@example.invalid"); await input("#sale-buyer-country", "Netherlands"); await save();
  assert.equal(clients.length, 3); assert.equal(clients.at(-1).phone, null); assert.equal(watch.clientId, 91);
  assert.equal(writes.at(-1).body.purchasePrice, 100000); assert.equal(writes.at(-1).body.salePrice, 180000);
  await wait("document.querySelector('main').innerText.includes('email-only@example.invalid')");
  const buyerSummary = await evaluate(`(() => {const card=document.querySelector('[data-testid="card-watch-buyer"]'),notes=document.querySelector('[data-testid="text-notes-display"]');return {text:card?.innerText,clientHref:card?.querySelector('[data-testid="link-watch-buyer-client"]')?.getAttribute('href'),beforeNotes:!!card&&!!notes&&(card.compareDocumentPosition(notes)&Node.DOCUMENT_POSITION_FOLLOWING)>0}})()`);
  assert(buyerSummary.text.includes("Email only Buyer"));
  assert(buyerSummary.text.includes("email-only@example.invalid"));
  assert(buyerSummary.text.includes("Netherlands"));
  assert(buyerSummary.beforeNotes, "buyer information appears above Notes");
  assert.equal(buyerSummary.clientHref, "/clients/92");
  await send("Page.reload"); await wait("document.querySelector('main')?.innerText.includes('email-only@example.invalid')", "linked contact survives reload");
  await send("Page.navigate", { url: `${base}/clients` });
  await wait("document.querySelector('main')?.innerText.includes('Email only Buyer') && document.querySelector('main')?.innerText.includes('email-only@example.invalid')", "new buyer appears in Clients");
  await send("Page.navigate", { url: `${base}/inventory/11` });
  await wait("document.querySelector('main')?.innerText.includes('email-only@example.invalid')");
  await edit(); await input("#sale-buyer-search", "SAVED@");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait("document.querySelector('[role=dialog]').innerText.includes('Existing client: Saved Buyer')");
  await evaluate("document.querySelector('fieldset').scrollIntoView({block:'center'})");
  await writeFile("/tmp/sale-buyer-desktop.jpg", Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
  const original = structuredClone(clients[0]); await save();
  assert.equal(clients.length, 3); assert.equal(watch.buyerId, 12); assert.deepEqual(clients[0], original);
  await edit(); await newBuyer(); await input("#sale-buyer-name", "Name Only Buyer"); await save();
  assert.equal(clients.at(-1).name, "Name Only Buyer"); assert.equal(clients.at(-1).email, null);
  await edit(); await newBuyer(); await input("#sale-buyer-phone", "+31 6 9988");
  const count = writes.length; await click("Save Changes");
  await wait("document.querySelector('[role=dialog]').innerText.includes('Buyer name is required')");
  assert.equal(writes.length, count, "incomplete contact must not issue a save");
  await input("#sale-buyer-name", "All Details Buyer"); await input("#sale-buyer-email", "all@example.invalid"); await input("#sale-buyer-country", "Netherlands");
  failSave = true; const clientCount = clients.length; const priorBuyer = watch.buyerId;
  await click("Save Changes"); await wait("document.querySelector('[role=dialog]').innerText.includes('Fixture save failed')");
  assert.equal(clients.length, clientCount); assert.equal(watch.buyerId, priorBuyer);
  assert.equal(await evaluate("document.querySelector('#sale-buyer-phone').value"), "+31 6 9988");
  await save();
  assert.equal(clients.length, clientCount + 1);
  assert.deepEqual([clients.at(-1).email, clients.at(-1).phone, clients.at(-1).country], ["all@example.invalid", "+31 6 9988", "Netherlands"]);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await edit(); await newBuyer(); await input("#sale-buyer-name", "Duplicate"); await input("#sale-buyer-email", "saved@example.invalid");
  await click("Save Changes"); await wait("document.querySelector('[role=dialog]').innerText.includes('already exists')");
  assert.equal(clients.length, clientCount + 1);
  await input("#sale-buyer-email", "mobile@example.invalid");
  await evaluate("document.querySelector('fieldset').scrollIntoView({block:'center'})");
  assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth || document.querySelector('[role=dialog]').scrollWidth>document.querySelector('[role=dialog]').clientWidth"), false);
  await writeFile("/tmp/sale-buyer-mobile.jpg", Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
  await click("Cancel");
  assert.equal(clients.length, clientCount + 1, "cancel creates no client");
  assert(writes.every(write => (write.path === "/api/inventory/11" && write.method === "PUT")
    || (write.path === "/api/clients/watch-buyers/sync" && write.method === "POST")));
  assert.deepEqual(errors, []);
  console.log("PASS: legacy sale edit; name/email with no phone; name-only creation; Clients directory and reload persistence; existing-client keyboard selection without profile edits; seller preserved; exact cents; validation; duplicate conflict; failed-save retention/retry; mobile layout and cancel. Browser-only API fixtures; no live records/accounts modified.");
} finally {
  socket?.close(); chrome.kill("SIGTERM"); await pause(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
