// UI tests with browser-only API fixtures; never creates accounts or writes business data.
// Requires running dev workflow and the workspace's Chromium executable.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import WebSocket from "ws";

const profile = await mkdtemp(join(tmpdir(), "dashboard-search-"));
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=9334", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9334/json")).json(); break; } catch { await pause(100); }
  }
  assert(targets, "Chromium did not start");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let id = 0, hidden = false, profit = 120000;
  const pending = new Map(), errors = [], writes = [];
  const watch = (id, referenceNumber, status = "in_stock") => ({
    id, brand: "Rolex", model: `Fixture watch ${id}`, referenceNumber, serialNumber: `SERIAL-${id}`, status,
    purchasePrice: 100000, targetSellPrice: 150000, salePrice: status === "sold" ? 220000 : 0,
    soldDate: status === "sold" ? new Date().toISOString() : null,
    box: true, papers: true, condition: "Good", year: 2023,
  });
  const watches = [watch(1, "124270", "sold"), watch(2, "124270"), watch(3, "124270-LN"), watch(4, "WSTA0052"),
    ...Array.from({ length: 14 }, (_, index) => watch(10 + index, `SCROLL-${index}`))];
  Object.assign(watches[3], { brand: "Cartier", model: "Tank", internalSerial: "WB-007", notes: "Blue dial" });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id; pending.set(key, { resolve, reject });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  socket.on("message", async raw => {
    const event = JSON.parse(raw);
    if (event.id) {
      const request = pending.get(event.id); pending.delete(event.id);
      if (event.error) request?.reject(new Error(event.error.message)); else request?.resolve(event.result);
    }
    if (event.method === "Runtime.exceptionThrown") errors.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    if (event.method !== "Fetch.requestPaused") return;
    const { request, requestId } = event.params;
    const path = new URL(request.url).pathname;
    if (request.method !== "GET") writes.push(path);
    let data = {};
    if (path === "/api/auth/user") data = { id: 999, username: "fixture-only" };
    else if (path === "/api/inventory") {
      watches[0].salePrice = 100000 + profit;
      data = watches;
    } else if (/^\/api\/inventory\/\d+$/.test(path)) data = watches.find(w => w.id === Number(path.split("/").at(-1)));
    else if (path === "/api/settings") data = { monthly_profit_goal: 200000, dashboard_sections: { quick_actions: { visible: !hidden, order: 1 } } };
    else if (path === "/api/clients") data = [];
    await send("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(data)).toString("base64") });
  });
  const evaluate = async expression => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timeout: ${label}`);
  };
  const input = async value => {
    await evaluate(`(() => {const el=document.querySelector('#dashboard-reference-search');el.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await pause(120);
  };
  const key = async value => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: value, code: value, windowsVirtualKeyCode: ({ Enter: 13, ArrowDown: 40, ArrowUp: 38, Escape: 27, Tab: 9 })[value] });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: value, code: value });
    await pause(120);
  };
  const home = async () => {
    await send("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/` });
    await wait(`!!document.querySelector('#dashboard-reference-search')`);
  };
  await send("Runtime.enable"); await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false });
  await home();
  assert.equal(await evaluate(`document.querySelectorAll('ul[aria-label="Matching watches"] a').length`), 0);
  const placement = await evaluate(`(() => {const search=document.querySelector('#reference-search-title').closest('section');return {previous:search.previousElementSibling.innerText,beforeGoal:search.previousElementSibling.previousElementSibling.innerText}})()`);
  assert(placement.previous.includes("Monthly Goal")); assert(placement.beforeGoal.includes("Quick Actions"));
  assert.equal(await evaluate(`document.querySelector('#dashboard-reference-search').hasAttribute('placeholder')`), false);
  for (const query of ["Cartier", "Tank Cartier", "SERIAL-4", "WB-007", "blue dial"]) {
    await input(query);
    assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('ul[aria-label="Matching watches"] a'),el=>el.getAttribute('href'))`), ["/inventory/4"], `inventory search: ${query}`);
  }
  assert((await evaluate(`document.querySelector('ul[aria-label="Matching watches"]').innerText`)).includes("WB-007"));
  await input(" 124270 ");
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('ul[aria-label="Matching watches"] a'),el=>el.getAttribute('href'))`), ["/inventory/2", "/inventory/1", "/inventory/3"]);
  assert((await evaluate(`document.querySelector('ul[aria-label="Matching watches"]').innerText`)).includes("SERIAL-1"));
  const resultText = await evaluate(`document.querySelector('ul[aria-label="Matching watches"]').innerText`);
  assert(resultText.includes("IN STOCK"), "in-stock status is readable");
  assert(!resultText.includes("IN_STOCK"), "status label does not show database underscores");
  await key("Enter");
  assert.equal(await evaluate("location.pathname"), "/", "Enter must not choose an arbitrary duplicate");
  await key("ArrowDown");
  assert.equal(await evaluate("document.activeElement.getAttribute('href')"), "/inventory/2");
  await key("ArrowDown");
  assert.equal(await evaluate("document.activeElement.getAttribute('href')"), "/inventory/1");
  await key("Enter"); await wait(`location.pathname==='/inventory/1'`, "explicit keyboard selection opens sold watch");
  await home(); await input("  wsta0052 "); await key("Enter");
  await wait(`location.pathname==='/inventory/4'`, "case-insensitive unique match opens watch");
  await home(); await input("does-not-exist");
  assert((await evaluate("document.querySelector('#reference-search-message').innerText")).includes("No watches found"));
  await evaluate(`document.querySelector('[aria-label="Clear inventory search"]').click()`);
  assert.equal(await evaluate("document.querySelector('#dashboard-reference-search').value"), "");
  await input("124270"); await key("Escape");
  assert.equal(await evaluate(`!!document.querySelector('ul[aria-label="Matching watches"]')`), false);
  assert.equal(await evaluate("document.activeElement.id"), "dashboard-reference-search");
  await input("124270");
  await evaluate(`document.querySelector('#dashboard-reference-search').scrollIntoView({block:'center'})`);
  const gradient = await evaluate(`(() => {const root=document.querySelector('[aria-label="Monthly goal progress"]');return {value:root.getAttribute('aria-valuenow'),image:getComputedStyle(root.firstElementChild).backgroundImage,width:root.firstElementChild.getBoundingClientRect().width/ root.getBoundingClientRect().width}})()`);
  assert.equal(gradient.value, "60"); assert(gradient.image.includes("linear-gradient")); assert(Math.abs(gradient.width - .6) < .01);
  await writeFile("/tmp/dashboard-reference-desktop.jpg", Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await home(); await input("SCROLL");
  await evaluate(`document.querySelector('ul[aria-label="Matching watches"]').scrollIntoView({block:'center'})`);
  assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth"), false);
  const point = await evaluate(`(() => {const r=document.querySelector('ul[aria-label="Matching watches"]').getBoundingClientRect();return {x:r.x+60,y:Math.min(r.y+200,innerHeight-60)}})()`);
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: point.x, y: point.y }] });
  for (let offset = 10; offset <= 100; offset += 15) {
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x, y: point.y - offset }] }); await pause(25);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await pause(200);
  assert.equal(await evaluate("location.pathname"), "/", "mobile scrolling must not open a watch");
  await writeFile("/tmp/dashboard-reference-mobile.jpg", Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
  await pause(850); // Past compatibility-click protection window, test a deliberate tap.
  const tap = await evaluate(`(() => {const a=document.querySelector('ul[aria-label="Matching watches"] a');a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect();return {x:r.x+30,y:r.y+r.height/2,path:a.getAttribute('href')}})()`);
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: tap.x, y: tap.y }] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await wait(`location.pathname===${JSON.stringify(tap.path)}`, "deliberate tap opens the intended watch");
  for (const [value, expected] of [[-10000, "0"], [300000, "100"], [0, "0"]]) {
    profit = value; await home();
    assert.equal(await evaluate(`document.querySelector('[aria-label="Monthly goal progress"]').getAttribute('aria-valuenow')`), expected);
  }
  // Shared-shell graduation checks against the actual app, not the preview copy.
  profit = 120000;
  await home();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await pause(120);
    assert.equal(await evaluate("document.body.classList.contains('wristby-modern')"), true);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.wm-desktop-rail')).display !== 'none'"), width >= 1024);
    assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth || document.querySelector('main').scrollWidth > document.querySelector('main').clientWidth"), false, `no workspace overflow at ${width}px`);
    assert.equal(await evaluate("document.querySelector('.wm-desktop-rail [aria-current=page]').getAttribute('href')"), "/");
    assert((await evaluate("getComputedStyle(document.querySelector('main')).fontFamily")).includes("DM Sans"));
    await evaluate("document.querySelector('main').scrollTo(0,0)");
    if (width === 1440 || width === 390) {
      await writeFile(`/tmp/wristby-modern-${width}.jpg`, Buffer.from((await send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
    }
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("document.querySelector('[aria-label=\"Open navigation\"]').click()");
  await wait("!!document.querySelector('[role=dialog].wristby-modern-drawer')", "navigation drawer opens");
  await wait("Math.abs(document.querySelector('.wristby-modern-drawer').getBoundingClientRect().x)<1", "left drawer animation settles");
  assert.equal(await evaluate("document.querySelectorAll('.wristby-modern-drawer .wm-nav-link').length"), 7);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.wristby-modern-drawer .wm-sidebar')).backgroundColor"), "rgb(24, 61, 51)");
  await evaluate("document.querySelector('.wristby-modern-drawer a[href=\"/inventory\"]').click()");
  await wait("location.pathname==='/inventory' && !document.querySelector('.wristby-modern-drawer')", "navigation closes the mobile drawer");
  await wait("document.querySelector('main h1, main h2')?.textContent==='Inventory'", "inventory still renders inside the shared shell");
  assert.equal(await evaluate("document.querySelector('.wm-desktop-rail [aria-current=page]').getAttribute('href')"), "/inventory");
  await send("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard` });
  await wait("!!document.querySelector('#dashboard-reference-search')", "dashboard alias loads");
  assert.equal(await evaluate("document.querySelector('.wm-desktop-rail [aria-current=page]').getAttribute('href')"), "/");
  hidden = true;
  await send("Page.navigate", { url: `https://${process.env.REPLIT_DEV_DOMAIN}/` });
  await wait(`document.body?.innerText.includes('Monthly Goal')`);
  assert.equal(await evaluate(`!!document.querySelector('#dashboard-reference-search')`), false);
  assert.deepEqual(writes, [], "search must not write any data");
  assert.deepEqual(errors, [], "no browser exceptions");
  console.log("PASS: reference lookup and keyboard navigation, mobile scroll and deliberate tap, green goal gradient and boundary fills, Quick Actions visibility; modern shell at 320–1440px, left drawer routes and close-on-selection, active dashboard alias, shared inventory shell. Browser-only API fixtures; no live accounts/data changed. Screenshots: /tmp/wristby-modern-{1440,390}.jpg");
} finally {
  socket?.close(); chrome.kill("SIGTERM"); await pause(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
