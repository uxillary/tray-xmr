// Local Chromium acceptance; no browser dependency or personal profile required.
// node scripts/verify-interactive-resources.mjs <chromium.exe> <loopback-url>
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
const output = resolve('docs/evidence/m13f');
mkdirSync(output, { recursive: true });
const route = '/troubleshoot/xmrig-log-reference/';
const lesson = '/learn/mining-difficulty-expected-rewards/';
const routes = [route, lesson];
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
const profile = mkdtempSync(join(tmpdir(), 'ember-m13f-'));
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
  const text = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`);
  const checks = [];
  const check = (name, observed) => checks.push({ name, observed, passed: true });
  const input = (selector, value, type = 'input') => evaluate(`(() => {const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event(${JSON.stringify(type)},{bubbles:true}));})()`);
  const visibleIds = () => evaluate(`[...document.querySelectorAll('[data-reference-id]:not([hidden])')].map(e=>e.dataset.referenceId)`);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await resize(1440); await navigate(route);
  assert.equal((await visibleIds()).length,15);
  assert.equal(await evaluate(`document.querySelector('#reference-filter').hidden`),false);
  await screenshot('reference-desktop');
  for(const [query,expected] of [['  HUGE   pages 50% ',['huge-pages-partial']],['cpu READY threads',['cpu-ready']],['HP allocation',null],['[.*(?= <script>',[]]]){
    await input('#reference-query',query);const ids=await visibleIds();if(expected)assert.deepEqual(ids,expected);else assert.ok(ids.includes('huge-pages-full'));
    check(`Reference search ${query}`,ids);
  }
  assert.equal(await evaluate(`document.querySelector('#reference-empty').hidden`),false);
  assert.equal(await evaluate(`document.querySelector('#reference-query').value`),'[.*(?= <script>');
  await screenshot('reference-no-results','#reference-filter');
  await input('#reference-category','cpu-memory','change');await click('#reference-clear');assert.equal((await visibleIds()).length,5);
  await input('#reference-query','huge pages 100%');assert.deepEqual(await visibleIds(),['huge-pages-full']);
  await screenshot('reference-filtered','#reference-filter');
  await input('#reference-category','submissions','change');assert.equal((await visibleIds()).length,0);
  await click('#reference-filter [type=reset]');assert.equal((await visibleIds()).length,15);
  check('Categories, combined filters, clear retains category and reset restores all',true);
  await navigate(route+'#share-accepted');assert.equal(await evaluate(`document.querySelector('#share-accepted').closest('[hidden]')`),null);
  await input('#reference-query','huge pages');
  await evaluate(`location.hash='share-rejected'`);await delay(120);assert.equal((await visibleIds()).length,15);
  await evaluate('history.back()');await delay(120);assert.equal(await evaluate('location.hash'),'#share-accepted');
  await evaluate('history.forward()');await delay(120);assert.equal(await evaluate('location.hash'),'#share-rejected');
  await input('#reference-query','huge pages');await click('a[href="#share-rejected"]');await delay(120);assert.equal((await visibleIds()).length,15);
  await input('#reference-query','huge pages');await click('a[href="#submissions"]');await delay(120);assert.equal((await visibleIds()).length,15);
  assert.equal(await evaluate('location.search'),'');
  check('Direct fragment, hidden entry/category reveal, same fragment and back/forward',true);
  await navigate(lesson);
  assert.equal(await text('#teaching-gross'),'0.015 XMR');assert.equal(await text('#teaching-contribution'),'0.1%');
  assert.equal(await text('#teaching-difficulty'),'120,000,000');assert.equal(await text('#teaching-hashes'),'3,600,000');assert.equal(await text('#teaching-blocks'),'0.03');
  await screenshot('teaching-desktop','#teaching-workspace');
  const announcement = await text('#teaching-announcement');
  await input('#teaching-miner','2000');assert.equal(await text('#teaching-gross'),'0.03 XMR');
  await delay(500);assert.equal(await text('#teaching-announcement'),announcement);
  await evaluate(`document.querySelector('#teaching-miner').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`);
  await delay(500);assert.match(await text('#teaching-announcement'),/0.03 XMR/);
  await input('#teaching-network','2000000');assert.equal(await text('#teaching-gross'),'0.015 XMR');
  await input('#teaching-seconds','7200');assert.equal(await text('#teaching-gross'),'0.03 XMR');
  await input('#teaching-reward','1');assert.equal(await text('#teaching-gross'),'0.06 XMR');assert.equal(await text('#teaching-one-block'),'1 XMR');
  await input('#teaching-miner','2');await input('#teaching-minerUnit','kH/s','change');assert.equal(await text('#teaching-gross'),'0.06 XMR');
  await input('#teaching-network','2');await input('#teaching-networkUnit','MH/s','change');assert.equal(await text('#teaching-gross'),'0.06 XMR');
  check('Default arithmetic, changed miner/network/duration/reward, equivalent units and conditional reward',true);
  await input('#teaching-seconds','10800');assert.equal(await evaluate(`document.querySelector('#teaching-duration-slider').value`),'10800');
  await input('#teaching-duration-slider','14400');assert.equal(await evaluate(`document.querySelector('#teaching-seconds').value`),'14400');
  await input('#teaching-seconds','3,600');assert.equal(await evaluate(`document.querySelector('#teaching-duration-slider').value`),'3600');
  await input('#teaching-seconds','1');assert.equal(await evaluate(`document.querySelector('#teaching-duration-slider').hidden`),true);
  await input('#teaching-seconds','0');assert.equal(await text('#teaching-gross'),'—');assert.equal(await evaluate(`document.querySelector('#teaching-seconds').getAttribute('aria-invalid')`),'true');
  await screenshot('teaching-invalid','#teaching-form');
  await input('#teaching-seconds','3600');assert.equal(await text('#teaching-gross'),'0.03 XMR');
  await input('#teaching-miner','3000000');assert.equal(await text('#teaching-gross'),'—');
  await evaluate(`document.querySelector('#teaching-form [type=reset]').focus()`);
  await click('#teaching-form [type=reset]');assert.equal(await text('#teaching-gross'),'0.015 XMR');assert.equal(await evaluate(`document.querySelectorAll('[aria-invalid=true]').length`),0);
  assert.equal(await evaluate(`document.activeElement.type`),'reset');
  check('Synchronized slider and precise duration, locale duration, invalid/recovery and reset',true);
  await input('#teaching-miner','0.000000001');await input('#teaching-network','1000000000000000000');
  assert.match(await text('#teaching-gross'),/e-/);assert.notEqual(await text('#teaching-contribution'),'0%');
  assert.equal(await evaluate(`document.querySelector('#teaching-fraction').style.minWidth`),'');
  await screenshot('teaching-tiny','#teaching-results-title');
  await input('#teaching-miner','0');assert.equal(await text('#teaching-gross'),'0 XMR');
  await click('#teaching-form [type=reset]');await input('#teaching-reward','0');assert.equal(await text('#teaching-one-block'),'0 XMR');
  await click('#teaching-form [type=reset]');
  check('Tiny nonzero display and zero miner/reward',true);
  const key = async (key, code, virtualKey) => {
    await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:virtualKey,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtualKey});
  };
  const keyboard=[];
  for(const path of routes){
    await navigate(path);const sequence=[];
    for(let i=0;i<45;i++){
      await key('Tab','Tab',9);
      const active=await evaluate(`({id:document.activeElement.id,tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle,width:getComputedStyle(document.activeElement).outlineWidth})`);sequence.push(active);
      if(active.id===(path===route?'reference-clear':'teaching-duration-slider'))break;
    }
    assert.ok(sequence.some(x=>x.id===(path===route?'reference-query':'teaching-miner')));
    assert.equal(sequence.at(-1).outline,'solid');assert.ok(parseFloat(sequence.at(-1).width)>=2);
    if(path===lesson){await key('ArrowRight','ArrowRight',39);assert.equal(await evaluate(`document.querySelector('#teaching-seconds').value`),'7200');}
    else {await key('Enter','Enter',13);assert.equal(await evaluate('document.activeElement.id'),'reference-query');}
    keyboard.push({path,sequence});
  }
  check('Actual keyboard Tab order, visible focus, clear Enter and duration ArrowRight',keyboard);
  const responsive=[],anchors=[];
  for(const path of routes)for(const width of widths){
    await resize(width);await navigate(path);
    const geometry=await evaluate(`({viewport:innerWidth,document:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length})`);
    assert.ok(geometry.document<=width,`${path} overflow ${width}: ${geometry.document}`);assert.equal(geometry.h1,1);responsive.push({path,width,...geometry});
    const target=path===route?'share-accepted':'relative-hashrate';
    await navigate(path+'#'+target);await delay(100);
    const anchor=await evaluate(`({top:document.getElementById('${target}').getBoundingClientRect().top,header:document.querySelector('.site-header').getBoundingClientRect().bottom})`);
    assert.ok(anchor.top>=anchor.header,JSON.stringify({path,width,anchor}));anchors.push({path,width,...anchor});
    if(width===390||width===320){
      await navigate(path);await screenshot(`${path===route?'reference':'teaching'}-${width}`,path===route?'#reference-filter':'#teaching-workspace');
      if(path===lesson)await screenshot(`teaching-results-${width}`,'.teaching-results');
      else {await input('#reference-query','huge pages 100%');await screenshot(`reference-match-${width}`,'[data-reference-id="huge-pages-full"]');}
    }
  }
  check('All requested responsive widths and sticky-header anchor clearance',anchors);
  const contrast=[];
  for(const path of routes){
    await resize(1440);await navigate(path);
    const groups=await evaluate(`(() => {
      const rgb=s=>s.match(/[\\d.]+/g).map(Number);
      const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const groups=new Map();
      for(const e of document.querySelectorAll('.technical-resource *')){
        if(!e.getBoundingClientRect().width||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.matches('input,select'))continue;
        const s=getComputedStyle(e);let parent=e,bg;while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}if(!bg)continue;
        const fg=rgb(s.color),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
        const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
        groups.set(s.color+bg.join()+s.fontSize+s.fontWeight,{foreground:s.color,background:bg,size:s.fontSize,weight:s.fontWeight,ratio,required:large?3:4.5});
      }return [...groups.values()];})()`);
    assert.ok(groups.length>10);assert.ok(groups.every(c=>c.ratio>=c.required),JSON.stringify(groups.filter(c=>c.ratio<c.required)));contrast.push({path,groups});
    const ax=await send('Accessibility.getFullAXTree');const names=ax.nodes.map(n=>n.name?.value).filter(Boolean).join('\n');
    assert.match(names,path===route?/Search reference/:/0.015 XMR/);
    assert.equal(await evaluate(`document.querySelector('.technical-resource').getAnimations({subtree:true}).length`),0);
  }
  check('Computed contrast, accessibility tree equivalents and reduced-motion state',true);
  // Fresh cache-disabled observations of actual local encoded transfers.
  const transfers=[];await send('Network.setCacheDisabled',{cacheDisabled:true});
  for(const path of routes){const start=events.length;await navigate(path);await delay(150);const records=events.slice(start);const requests=records.filter(e=>e.method==='Network.responseReceived'&&['Document','Stylesheet','Script'].includes(e.params.type));transfers.push({path,resources:requests.map(e=>({url:e.params.response.url,type:e.params.type,encoding:e.params.response.headers['Content-Encoding']??null,encodedBytes:records.find(f=>f.method==='Network.loadingFinished'&&f.params.requestId===e.params.requestId)?.params.encodedDataLength??null}))});}
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  for(const path of routes){
    await navigate(path);const snapshot=await send('DOMSnapshot.captureSnapshot',{computedStyles:['display']});
    assert.ok(snapshot.strings.some(s=>s.includes(path===route?'CPU workers ready':'An average is not a payment schedule')));
    // DOMSnapshot is used while JavaScript execution is disabled.
    const doc=await send('DOM.getDocument',{depth:0});
    const html=await send('DOM.getOuterHTML',{nodeId:doc.root.nodeId});
    if(path===route){assert.equal((html.outerHTML.match(/data-reference-id=/g)||[]).length,15);assert.match(html.outerHTML, /id="reference-filter"[^>]*hidden/);}
    else assert.match(html.outerHTML,/id="teaching-workspace"[^>]*hidden/);
    await screenshot(`no-javascript-${path===route?'reference':'teaching'}`);
  }
  check('JavaScript-disabled complete static reference and lesson with inactive controls hidden',true);
  await send('Emulation.setScriptExecutionDisabled',{value:false});
  const runtimeErrors=events.filter(e=>e.method==='Runtime.exceptionThrown');
  const externalRequests=events.filter(e=>e.method==='Network.requestWillBeSent'&&/^https?:/.test(e.params.request.url)&&new URL(e.params.request.url).origin!==base.origin);
  const failedRequests=events.filter(e=>e.method==='Network.loadingFailed'||e.method==='Network.responseReceived'&&e.params.response.status>=400);
  assert.equal(runtimeErrors.length,0);assert.equal(externalRequests.length,0);assert.equal(failedRequests.length,0);
  writeFileSync(join(output,'browser-acceptance.json'),JSON.stringify({recordedAt:new Date().toISOString(),browser:version,baseUrl,identity,checks,responsive,contrast,transfers,runtimeErrors,externalRequests,failedRequests,limitations:'Headless desktop Chromium CSS widths; no native zoom, actual screen-reader session, other engines or physical devices.'},null,2)+'\n');
  console.log(`Verified ${identity.length} build identities, ${checks.length} interaction checks and ${responsive.length} viewport records.`);
  await command('Browser.close');
} finally {
  socket?.close();browser.kill();await delay(500);
  if(dirname(profile)!==resolve(tmpdir())||!basename(profile).startsWith('ember-m13f-'))throw new Error('Unexpected temporary browser profile path.');
  rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});
}

