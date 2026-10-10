import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_SITE_URL, resolveSiteUrl, siteOrigin } from '../src/lib/site-origin.mjs';

test('local development has a useful localhost origin without configuration', () => {
  assert.equal(resolveSiteUrl({ releaseBuild: false }), LOCAL_SITE_URL);
});

test('an explicit process environment value takes precedence over file configuration', () => {
  assert.equal(resolveSiteUrl({ fileValue: 'https://from-file.test', envValue: 'https://release.test', releaseBuild: true }), 'https://release.test');
});

test('release builds require an explicit HTTPS origin', () => {
  assert.throws(() => resolveSiteUrl({ releaseBuild: true }), /Production builds require SITE_URL/);
  assert.equal(resolveSiteUrl({ envValue: 'https://ember-m12a.invalid/', releaseBuild: true }), 'https://ember-m12a.invalid');
});

test('release builds reject placeholders, insecure origins and non-origin URL parts', () => {
  for (const value of ['https://example.com', 'https://preview.example.com', 'http://release.test', 'https://release.test/path', 'https://user@release.test']) {
    assert.throws(() => resolveSiteUrl({ envValue: value, releaseBuild: true }), Error, value);
  }
});

test('shared metadata requires Astro to provide the centrally configured site URL', () => {
  assert.equal(siteOrigin(new URL('https://ember-m12a.invalid/a/')), 'https://ember-m12a.invalid');
  assert.throws(() => siteOrigin(undefined), /Astro site origin is unavailable/);
});
