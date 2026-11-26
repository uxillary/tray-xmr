// Local Chromium acceptance; no browser dependency or personal profile required.
// node scripts/verify-mining-efficiency.mjs <chromium.exe> <loopback-url>
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [executable, baseUrl] = process.argv.slice(2);
const base = new URL(baseUrl);
if (!executable || base.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Supply installed Chromium and a loopback HTTP preview.');
const output = resolve('docs/evidence/m13e');
mkdirSync(output, { recursive: true });
const route = '/tools/mining-efficiency-calculator/';
const routes = [route, '/tools/', '/tools/electricity-cost-calculator/', '/tools/monero-mining-profitability-calculator/', '/troubleshoot/xmrig-low-hashrate/', '/learn/xmrig-cpu-threads/'];
const widths = [1440, 1280, 1024, 768, 600, 390, 360, 320];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const identity = [];
// Every current published route, not just the routes inspected visually.
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = new URL(location).pathname;
  const response = await fetch(new URL(path, base));
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200);
  assert.equal(sha(bytes), sha(readFileSync(join('dist', path.slice(1), 'index.html'))));
  identity.push({ route: path, sha256: sha(bytes), status: response.status });
}
assert.equal(identity.length, 21);
const profile = mkdtempSync(join(tmpdir(), 'ember-m13e-'));
const browser = spawn(executable, ['--headless=new', '--no-first-run', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, id = 0;
const pending = new Map();
const events = [];
const command = (method, params = {}, sessionId) => new Promise((accept, reject) => {
  const key = ++id;
  const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timeout: ${method}`)); }, 20000);
  pending.set(key, { accept, reject, timer });
  socket.send(JSON.stringify({ id: key, method, params, ...(sessionId ? { sessionId } : {}) }));
});
try {
  let port;
  for (let tries = 0; tries < 100; tries++) {
    try { port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/); break; }
    catch { await delay(100); }
  }
  if (!port) throw new Error('Chromium did not start.');
  socket = new WebSocket(`ws://127.0.0.1:${port[0]}${port[1]}`);
  await new Promise((accept, reject) => { socket.addEventListener('open', accept, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(String(data));
    if (!message.id) { events.push(message); return; }
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.accept(message.result);
  });
  const version = await command('Browser.getVersion');
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => command(method, params, sessionId);
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const resize = width => send('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: false });
  const navigate = async path => {
    const start = events.length;
    await send('Page.navigate', { url: new URL(path, base).href });
    for (let i = 0; i < 200; i++) {
      if (events.slice(start).some(e => e.sessionId === sessionId && ['Page.loadEventFired', 'Page.navigatedWithinDocument'].includes(e.method))) { await delay(100); return; }
      await delay(25);
    }
    throw new Error(`Page failed to load: ${path}`);
  };
  const screenshot = async (name, selector) => {
    if (selector) await evaluate(`scrollTo({top:scrollY+document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().top-document.querySelector('.site-header').getBoundingClientRect().height-20,behavior:'instant'})`);
    else await evaluate('scrollTo({top:0,behavior:"instant"})');
    await delay(80);
    const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(output, `${name}.png`), Buffer.from(image.data, 'base64'));
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const input = (name, value, type = 'input') => evaluate(`(() => {const el=document.querySelector('#efficiency-form').elements.namedItem(${JSON.stringify(name)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event(${JSON.stringify(type)},{bubbles:true}));})()`);
  const text = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`);
  const checks = [];
  const check = (name, observed) => checks.push({ name, observed, passed: true });
  await resize(1440); await navigate(route);
  assert.deepEqual(await evaluate(`['aHashrate','aWatts','bHashrate','bWatts','tariff'].map(n=>document.querySelector('#efficiency-form').elements.namedItem(n).value)`), ['', '', '', '', '']);
  assert.equal(await evaluate(`document.querySelectorAll('[aria-invalid="true"]').length`), 0);
  check('Blank initial measurements and quiet validation', true);
  await screenshot('desktop-blank');
  await evaluate(`document.querySelector('#a-watts').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`);
  assert.equal(await text('#aWatts-error'), 'Enter a value.');
  assert.equal(await text('#bWatts-error'), '');
  await click('#efficiency-example');
  assert.equal(await text('#aWatts-error'), '');
  assert.equal(await text('#a-efficiency'), '58.62'); assert.equal(await text('#b-efficiency'), '75.24');
  assert.equal(await text('#efficiency-change'), '+28.35%');
  assert.match(await text('#cost-difference-365'), /87.60/);
  const bars = await evaluate(`['a','b'].map(k=>document.querySelector('#'+k+'-bar').getBoundingClientRect().width/document.querySelector('#'+k+'-bar').parentElement.getBoundingClientRect().width)`);
  assert.ok(Math.abs(bars[0] - (8500 / 145) / (7900 / 105)) < .001); assert.equal(bars[1], 1);
  check('Example arithmetic and proportional zero-baseline bars', bars);
  await screenshot('desktop-comparison');
  await screenshot('comparison-interpretation', '.efficiency-interpretation');
  await delay(500);
  const previousAnnouncement = await text('#efficiency-announcement');
  await input('bHashrate', '8000'); await delay(500);
  assert.equal(await text('#efficiency-announcement'), previousAnnouncement);
  await evaluate(`document.querySelector('#b-hashrate').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`);
  await delay(500);
  assert.notEqual(await text('#efficiency-announcement'), previousAnnouncement);
  check('Touched-field errors and debounced result announcements avoid per-keystroke chatter', true);
  await click('#efficiency-example');
  await input('aHashrate', '8.5'); await input('aUnit', 'kH/s', 'change');
  assert.equal(await text('#a-efficiency'), '58.62');
  await input('bHashrate', '9000'); assert.match(await text('#hashrate-difference'), /500/);
  await input('bWatts', '150'); assert.equal(await text('#b-efficiency'), '60');
  await input('aName', '<img src=x onerror=alert(1)>');
  assert.equal(await evaluate(`document.querySelector('#a-result-name').children.length`), 0);
  await input('aName', 'Current profile'); await input('bName', 'Alternative profile');
  check('Editing both configurations, units and safe optional names', true);
  await input('tariff', 'bad'); assert.equal(await text('#a-cost-1'), '—');
  assert.equal(await text('#a-efficiency'), '58.62'); assert.match(await text('#a-energy'), /3.48/);
  await screenshot('invalid-input', '#efficiency-form');
  await input('hours', '25'); assert.equal(await text('#a-energy'), '—'); assert.equal(await text('#a-efficiency'), '58.62');
  await input('hours', '12'); await input('tariff', '0.5'); await input('currency', 'EUR', 'change');
  assert.match(await text('#a-cost-1'), /€/); assert.match(await text('#a-cost-1'), /0.87/);
  assert.match(await text('#efficiency-currency-note'), /no conversion/);
  await screenshot('invalid-input-recovery', '#efficiency-form');
  check('Invalid tariff/runtime preserve efficiency and suppress affected projections; recovery and currency work', true);
  for (const currency of ['USD', 'GBP']) { await input('currency', currency, 'change'); assert.notEqual(await text('#a-cost-1'), '—'); }
  await input('tariff', '0'); assert.match(await text('#a-cost-365'), /£0(?:\.00)?$/);
  await input('hours', '0'); assert.equal(await text('#a-energy'), '0 kWh');
  await input('bWatts', ''); assert.equal(await text('#efficiency-change'), '—'); assert.equal(await text('#cost-difference-1'), '—');
  check('Zero tariff/runtime and stale-result removal', true);
  const beforeResetFocus = await evaluate('document.activeElement.id');
  await click('[type="reset"]'); await delay(80);
  assert.equal(await evaluate('document.activeElement.id'), beforeResetFocus);
  assert.equal(await text('#a-efficiency'), '—'); assert.equal(await text('#aHashrate-error'), '');
  assert.equal(await evaluate(`document.querySelector('#efficiency-example-note').hidden`), true);
  assert.deepEqual(await evaluate(`['aHashrate','aWatts','bHashrate','bWatts','tariff','hours','currency','aUnit','bUnit'].map(n=>document.querySelector('#efficiency-form').elements.namedItem(n).value)`), ['', '', '', '', '', '24', 'GBP', 'H/s', 'H/s']);
  check('Reset restores blank measurements without moving focus', true);
  // Actual CDP keyboard events: tab order, focus style, Enter and arrow scrolling.
  await navigate(route);
  const key = async (key, code, virtualKey) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtualKey, ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtualKey });
  };
  const focusOrder = [];
  for (let i = 0; i < 40; i++) {
    await key('Tab', 'Tab', 9);
    const active = await evaluate(`({id:document.activeElement.id,tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle,width:getComputedStyle(document.activeElement).outlineWidth})`);
    focusOrder.push(active);
    if (active.id === 'efficiency-example') { assert.equal(active.outline, 'solid'); assert.equal(active.width, '2px'); await key('Enter', 'Enter', 13); }
    if (active.id === 'b-watts') break;
  }
  assert.ok(focusOrder.some(f => f.id === 'a-hashrate')); assert.ok(focusOrder.some(f => f.id === 'b-watts'));
  assert.equal(await text('#efficiency-change'), '+28.35%', JSON.stringify(focusOrder));
  check('Keyboard Tab order, visible focus and Enter example activation', focusOrder);
  await resize(320);
  await evaluate(`document.querySelector('.efficiency-table-scroll').focus()`);
  await key('ArrowRight', 'ArrowRight', 39); await delay(200);
  const scroll = await evaluate(`({left:document.querySelector('.efficiency-table-scroll').scrollLeft,width:document.querySelector('.efficiency-table-scroll').clientWidth,content:document.querySelector('.efficiency-table-scroll').scrollWidth})`);
  assert.ok(scroll.left > 0); check('Keyboard table scrolling is contained', scroll);
  await resize(390); await navigate(route); await click('#efficiency-example');
  await screenshot('mobile-inputs', '#efficiency-form'); await screenshot('mobile-comparison', '.efficiency-primary');
  const responsive = [];
  for (const path of routes) for (const width of widths) {
    await resize(width); await navigate(path);
    if (path === route) await click('#efficiency-example');
    const geometry = await evaluate(`({viewport:innerWidth,document:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,tables:[...document.querySelectorAll('[role="region"]')].map(e=>({label:e.getAttribute('aria-label'),width:e.clientWidth,scrollWidth:e.scrollWidth}))})`);
    assert.ok(geometry.document <= width, `${path} overflows at ${width}: ${geometry.document}`);
    assert.equal(geometry.h1, 1);
    responsive.push({ route: path, width, ...geometry });
    if (path === route && ![1440, 390].includes(width)) await screenshot(`comparison-${width}`, width < 800 ? '.efficiency-primary' : undefined);
  }
  await resize(1440); await navigate(route); await click('#efficiency-example');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const anchors = [];
  for (const width of [1440, 390, 320]) {
    await resize(width); await navigate(route + '#measurement-method'); await delay(150);
    const geometry = await evaluate(`({top:document.querySelector('#measurement-method').getBoundingClientRect().top,headerBottom:document.querySelector('.site-header').getBoundingClientRect().bottom})`);
    assert.ok(geometry.top >= geometry.headerBottom); anchors.push({width,...geometry});
  }
  check('Measurement anchors clear the sticky header', anchors);
  await resize(1440); await navigate(route); await click('#efficiency-example');
  const accessibility = await send('Accessibility.getFullAXTree');
  const axText = accessibility.nodes.map(n => n.name?.value).filter(Boolean).join('\n');
  assert.match(axText, /58.62/); assert.match(axText, /75.24/); assert.match(axText, /Hashes per joule/);
  check('Accessibility tree retains numeric bar equivalents and table labels', true);
  // Computed contrast on opaque text/background pairs in the new workspace.
  const contrast = await evaluate(`(() => {
    const rgb=s=>s.match(/[\\d.]+/g).map(Number);
    const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const groups=new Map();
    for(const e of document.querySelectorAll('.efficiency-page *')){
      if(!e.getBoundingClientRect().width || ![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
      const s=getComputedStyle(e);let parent=e,bg;
      while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
      if(!bg)continue;
      const fg=rgb(s.color), ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
      const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
      groups.set(s.color+bg.join()+s.fontSize+s.fontWeight,{foreground:s.color,background:bg,size:s.fontSize,weight:s.fontWeight,ratio,required:large?3:4.5});
    }return [...groups.values()];})()`);
  assert.ok(contrast.length > 10); assert.ok(contrast.every(c => c.ratio >= c.required));
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
  assert.equal(await evaluate(`document.querySelector('.efficiency-instrument').getAnimations({subtree:true}).length`), 0);
  check('Reduced motion has no animated instrument elements', true);
  await send('Emulation.setScriptExecutionDisabled', { value: true }); await navigate(route);
  const noJs = await send('DOMSnapshot.captureSnapshot', { computedStyles: ['display'] });
  assert.ok(noJs.strings.some(s => s.includes('Interactive calculation requires JavaScript')));
  await screenshot('no-javascript');
  check('JavaScript-disabled static fallback and methods remain available', true);
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  const runtimeErrors = events.filter(e => e.method === 'Runtime.exceptionThrown');
  const externalRequests = events.filter(e => e.method === 'Network.requestWillBeSent' && /^https?:/.test(e.params.request.url) && new URL(e.params.request.url).origin !== base.origin);
  assert.equal(runtimeErrors.length, 0); assert.equal(externalRequests.length, 0);
  writeFileSync(join(output, 'browser-acceptance.json'), JSON.stringify({ recordedAt: new Date().toISOString(), browser: version, baseUrl, identity, checks, responsive, contrast, runtimeErrors, externalRequests, limitations: 'CSS viewports on headless desktop Chromium; no native zoom, screen-reader session, other engines or physical device verification.' }, null, 2) + '\n');
  console.log(`Verified ${identity.length} build identities, ${checks.length} interaction/mode checks, ${responsive.length} route/width cases and ${contrast.length} contrast groups.`);
  await command('Browser.close');
} finally {
  socket?.close(); browser.kill(); await delay(500);
  if (dirname(profile) !== resolve(tmpdir()) || !basename(profile).startsWith('ember-m13e-')) throw new Error('Unexpected temporary browser profile path.');
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
