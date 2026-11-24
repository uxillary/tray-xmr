import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_SITE_URL, resolveSiteUrl, resolveSiteIndexing, siteOrigin } from '../src/lib/site-origin.mjs';

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
  for (const value of ['https://example.com', 'https://preview.example.com', 'https://example.net', 'https://example.org', 'https://localhost', 'https://preview.localhost', 'https://127.0.0.1', 'https://[::1]', 'http://release.test', 'https://release.test/path', 'https://user@release.test']) {
    assert.throws(() => resolveSiteUrl({ envValue: value, releaseBuild: true }), Error, value);
  }
});

test('development and preview indexing fail closed, including misspelled settings', () => {
  assert.equal(resolveSiteIndexing(), 'noindex');
  assert.equal(resolveSiteIndexing({ value: 'noindex', site: LOCAL_SITE_URL }), 'noindex');
  for (const value of ['true', 'false', 'INDEX', 'preview']) {
    assert.throws(() => resolveSiteIndexing({ value }), /SITE_INDEXING must be/);
  }
});

test('a trailing DNS dot cannot bypass the example-origin safeguard', () => {
  assert.throws(() => resolveSiteUrl({ envValue: 'https://example.com.', releaseBuild: true }), /placeholder/);
});

test('indexing requires an explicit HTTPS public origin; audit origins stay protected', () => {
  // Known external hostname is a validation fixture, never Ember's configured domain.
  assert.equal(resolveSiteIndexing({ value: 'index', site: 'https://github.com' }), 'index');
  for (const site of [undefined, LOCAL_SITE_URL, 'https://localhost', 'https://example.com', 'https://ember-m12b0-audit.invalid', 'https://release.test', 'https://release.local', 'https://release.example']) {
    assert.throws(() => resolveSiteIndexing({ value: 'index', site }), Error, site);
  }
});

test('shared metadata requires Astro to provide the centrally configured site URL', () => {
  assert.equal(siteOrigin(new URL('https://ember-m12a.invalid/a/')), 'https://ember-m12a.invalid');
  assert.throws(() => siteOrigin(undefined), /Astro site origin is unavailable/);
});
