// Local laboratory observations, not Lighthouse scores or real-user field data.
// Usage: node scripts/measure-performance.mjs <chromium.exe> <loopback-url> <output.json>
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [executable, baseUrl, output] = process.argv.slice(2);
if (!executable || !baseUrl || !output) throw new Error('Supply Chromium executable, loopback preview URL and output JSON path.');
const base = new URL(baseUrl);
if (!['127.0.0.1', 'localhost'].includes(base.hostname) || base.protocol !== 'http:') throw new Error('Use a local HTTP preview, not a public site.');
const routes = ['/', '/tools/', '/tools/monero-mining-profitability-calculator/', '/tools/xmrig-log-decoder/', '/troubleshoot/xmrig-huge-pages/', '/guides/xmrig-windows-setup/'];
const profiles = [
  { name: 'desktop', width: 1440, height: 900, mobile: false, cpu: 1, latency: 0, download: -1, upload: -1 },
  { name: 'mobile-lab', width: 390, height: 844, mobile: true, cpu: 4, latency: 150, download: 204800, upload: 98304 },
];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const identity = [];
for (const route of routes) {
  const response = await fetch(new URL(route, base));
  const bytes = Buffer.from(await response.arrayBuffer());
  const file = join('dist', route.slice(1), 'index.html');
  if (response.status !== 200 || sha(bytes) !== sha(readFileSync(file))) throw new Error(`Preview identity mismatch: ${route}`);
  identity.push({ route, status: response.status, sha256: sha(bytes) });
}

const profileDirectory = mkdtempSync(join(tmpdir(), 'ember-m13a-chromium-'));
const browser = spawn(executable, ['--headless=new', '--no-first-run', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--disable-sync', '--mute-audio', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profileDirectory}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let nextId = 0;
const pending = new Map();
const listeners = new Map();
function command(method, params = {}, sessionId) {
  return new Promise((accept, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
    pending.set(id, { accept, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
const observe = (method, callback) => { listeners.set(method, [...(listeners.get(method) ?? []), callback]); };
const instrumentation = `(() => {
  const result = window.__emberPerf = { lcp: [], shifts: [], longtasks: [], errors: [], supported: PerformanceObserver.supportedEntryTypes };
  for (const [type, key] of [['largest-contentful-paint','lcp'], ['layout-shift','shifts'], ['longtask','longtasks']]) {
    if (result.supported.includes(type)) new PerformanceObserver(list => {
      for (const entry of list.getEntries()) result[key].push({ ...entry.toJSON(), element: entry.element?.tagName, id: entry.element?.id });
    }).observe({type, buffered:true});
  }
  addEventListener('error', event => result.errors.push(String(event.message)));
  addEventListener('unhandledrejection', event => result.errors.push(String(event.reason)));
})();`;

try {
  let devtools;
  for (let i = 0; i < 100; i++) {
    try { devtools = readFileSync(join(profileDirectory, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/); break; }
    catch { await delay(100); }
  }
  if (!devtools) throw new Error('Chromium debugging endpoint did not start.');
  socket = new WebSocket(`ws://127.0.0.1:${devtools[0]}${devtools[1]}`);
  await new Promise((accept, reject) => { socket.addEventListener('open', accept, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timer);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.accept(message.result);
    } else for (const callback of listeners.get(message.method) ?? []) callback(message.params, message.sessionId);
  });
  const version = await command('Browser.getVersion');
  const samples = [];
  for (const profile of profiles) for (const route of routes) for (let run = 1; run <= 3; run++) {
    const { browserContextId } = await command('Target.createBrowserContext');
    const { targetId } = await command('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params) => command(method, params, sessionId);
    const requests = new Map();
    const failed = [];
    const responses = (params, id) => {
      if (id === sessionId) requests.set(params.requestId, { url: params.response.url, type: params.type, status: params.response.status, mime: params.response.mimeType });
    };
    const finished = (params, id) => { if (id === sessionId && requests.has(params.requestId)) requests.get(params.requestId).transferBytes = params.encodedDataLength; };
    const failure = (params, id) => { if (id === sessionId) failed.push(params.errorText); };
    observe('Network.responseReceived', responses);
    observe('Network.loadingFinished', finished);
    observe('Network.loadingFailed', failure);
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: profile.width, height: profile.height, deviceScaleFactor: 1, mobile: profile.mobile });
    await send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    await send('Network.emulateNetworkConditions', { offline: false, latency: profile.latency, downloadThroughput: profile.download, uploadThroughput: profile.upload });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: instrumentation });
    await send('Performance.enable');
    const before = await send('Performance.getMetrics');
    const loaded = new Promise((accept, reject) => {
      const timer = setTimeout(() => reject(new Error(`Page load timeout: ${route}`)), 30000);
      const callback = (_, id) => { if (id === sessionId) { clearTimeout(timer); accept(); } };
      observe('Page.loadEventFired', callback);
    });
    await send('Page.navigate', { url: new URL(route, base).href });
    await loaded;
    await delay(5000);
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression: `JSON.stringify({
      ...window.__emberPerf,
      navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
      resources: performance.getEntriesByType('resource').map(r => r.toJSON()),
      paint: performance.getEntriesByType('paint').map(r => r.toJSON()),
      measuredAtMs: performance.now(),
      fonts: {status:document.fonts.status, faces:[...document.fonts].length},
      viewport: {width:innerWidth,height:innerHeight},
      animations: document.getAnimations().map(a => ({playState:a.playState,iterations:a.effect.getTiming().iterations})),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
    })`, returnByValue: true });
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    const measurements = JSON.parse(result.value);
    const after = await send('Performance.getMetrics');
    const initial = Object.fromEntries(before.metrics.map(m => [m.name, m.value]));
    const delta = Object.fromEntries(after.metrics.filter(m => ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration'].includes(m.name)).map(m => [m.name + 'Ms', (m.value - (initial[m.name] ?? 0)) * 1000]));
    let cls = 0, score = 0, start = 0, previous = 0;
    for (const shift of measurements.shifts.filter(s => !s.hadRecentInput)) {
      if (shift.startTime - previous > 1000 || shift.startTime - start > 5000) { score = 0; start = shift.startTime; }
      score += shift.value; previous = shift.startTime; cls = Math.max(cls, score);
    }
    const html = readFileSync(join('dist', route.slice(1), 'index.html'), 'utf8');
    const svg = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(m => m[0]);
    const network = [...requests.values()];
    const sample = { profile: profile.name, route, run, lcpMs: measurements.lcp.at(-1)?.startTime ?? null, cls, mainThread: delta,
      longTaskCount: measurements.longtasks.length,
      observedBlockingTimeMs: measurements.longtasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
      requestCount: network.length, totalTransferBytes: network.reduce((sum, r) => sum + (r.transferBytes ?? 0), 0),
      documentBytes: Buffer.byteLength(html), inlineSvgCount: svg.length, inlineSvgBytes: svg.reduce((sum, s) => sum + Buffer.byteLength(s), 0),
      network, failed, measurements };
    if (failed.length || measurements.errors.length || network.some(r => r.status >= 400 || new URL(r.url).origin !== base.origin)) throw new Error(`Unexpected failed/external request or runtime error: ${route}`);
    samples.push(sample);
    console.log(`${profile.name} ${route} ${run}/3: LCP ${sample.lcpMs}ms, CLS ${cls}, ${network.length} requests`);
    await command('Target.disposeBrowserContext', { browserContextId });
    for (const [event, callback] of [['Network.responseReceived',responses], ['Network.loadingFinished',finished], ['Network.loadingFailed',failure]]) listeners.set(event, listeners.get(event).filter(cb => cb !== callback));
  }
  writeFileSync(resolve(output), JSON.stringify({ recordedAt: new Date().toISOString(), browser: version, node: process.version, baseUrl, identity, profiles,
    method: 'Three cold contexts per route/profile; cache disabled; no interactions; five seconds after load. CDP main-thread duration deltas. Observed blocking time is over this bounded window, not Lighthouse TBT or INP. No field data.', samples }, null, 2) + '\n');
  await command('Browser.close');
} finally {
  socket?.close();
  browser.kill();
  await delay(500);
  // Only the dedicated directory created above is removed; never a user browser profile.
  if (dirname(profileDirectory) !== resolve(tmpdir()) || !basename(profileDirectory).startsWith('ember-m13a-chromium-')) throw new Error('Unexpected temporary profile location.');
  rmSync(profileDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}
