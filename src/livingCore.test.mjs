import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { livingCoreState } from "./livingCoreState.mjs";

// Reuse the repository's SSR component-test pattern and supported Node versions.
const vite = await createServer({
  cacheDir: "node_modules/.vite-ssr-tests", configFile: false, root: fileURLToPath(new URL("../", import.meta.url)),
  plugins: [react(), {
    name: "static-markup-styles", enforce: "pre",
    resolveId(id) { if (id.endsWith(".css")) return "\0static-markup-style:" + id; },
    load(id) { if (id.startsWith("\0static-markup-style:")) return "export default {}"; },
  }],
  // An unbound HTTP server keeps Vite's transport from opening a shared HMR port.
  server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
  optimizeDeps: { noDiscovery: true }, appType: "custom",
});
let LivingCore, MiningSessionTelemetry;
try {
  ({ LivingCore } = await vite.ssrLoadModule("/src/components/LivingCore.tsx"));
  ({ MiningSessionTelemetry } = await vite.ssrLoadModule("/src/components/MiningTelemetry.tsx"));
} catch (error) {
  await vite.close();
  throw error;
}
after(() => vite.close());

const mining = { state: "mining", startupStage: null, telemetryFreshness: "fresh", telemetry: { shortHashrate: 128 } };
const manifest = JSON.parse(readFileSync(new URL("../public/living-core/v3/manifest.json", import.meta.url), "utf8"));

test("all decorative poses use real local sprite sheets with a neutral static fallback", () => {
  for (const state of ["notConfigured", "ready", "starting", "mining", "paused", "stopping", "stopped", "error", "unavailable"]) {
    const html = renderToStaticMarkup(createElement(LivingCore, { view: livingCoreState({ session: { ...mining, state } }), reducedMotion: true }));
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /living-core--still/);
    assert.match(html, new RegExp(`data-lifecycle="${state}"`));
    assert.match(html, /scene-fallback\.png/);
    assert.match(html, new RegExp(manifest.assets[manifest.clips[state].character].file.replaceAll(".", "\\.")));
    assert.doesNotMatch(html, /<button|<canvas|aria-live/);
  }
});

test("stale Mining selects a quiet character and dormant crystal", () => {
  const view = livingCoreState({ session: { ...mining, telemetryFreshness: "stale" } });
  const html = renderToStaticMarkup(createElement(LivingCore, { view }));
  assert.match(html, /data-lifecycle="mining"/);
  assert.match(html, /data-pose="miningQuiet"/);
  assert.match(html, /data-active-work="false"/);
  assert.match(html, /crystal-dormant\.png/);
  assert.doesNotMatch(html, /crystal-lit\.png|living-core-light is-active/);
});

test("Home exposes status and freshness as text and preserves Stop after failed polling", () => {
  const props = { session: mining, setup: null, systemSnapshot: null, statusError: false, statusUnavailable: false, onStop() {} };
  const stale = renderToStaticMarkup(createElement(MiningSessionTelemetry, { ...props, session: { ...mining, telemetryFreshness: "stale" } }));
  assert.match(stale, /<h2>Mining<\/h2>/);
  assert.match(stale, /Updates delayed/);
  const failed = renderToStaticMarkup(createElement(MiningSessionTelemetry, { ...props, statusUnavailable: true }));
  assert.match(failed, /<h2>Status unavailable<\/h2>/);
  assert.match(failed, /Stop mining/);
  assert.doesNotMatch(failed, /data-active-work="true"|crystal-lit\.png|Ember is supervising/);
});

test("manifest references existing RGBA sheets with exact horizontal cell geometry", () => {
  assert.deepEqual(JSON.parse(readFileSync(new URL("./livingCoreManifest.json", import.meta.url), "utf8")), manifest);
  for (const [id, asset] of Object.entries(manifest.assets)) {
    const bytes = readFileSync(new URL(`../public/living-core/v3/${asset.file}`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG", id);
    assert.equal(bytes.readUInt32BE(16), asset.cellWidth * asset.frames, id);
    assert.equal(bytes.readUInt32BE(20), asset.cellHeight, id);
    assert.equal(bytes[24], 8, id);
    assert.equal(bytes[25], 6, `${id} must have an RGBA alpha channel`);
    assert.deepEqual(asset.anchor, [0, 0], id);
  }
  for (const clip of Object.values(manifest.clips)) {
    assert.ok(manifest.assets[clip.character]);
    assert.ok(manifest.assets[clip.crystal]);
  }
});
