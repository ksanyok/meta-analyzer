import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractMeta, lintMeta, analyzeMeta } from '../src/index.js';

const GOOD = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Blue Widgets for Small Workshops &amp; Garages</title>
<meta name="description" content="Compare blue widgets by size, price and durability. Free shipping on orders over $50 and a 30-day return policy on every widget we sell.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="/widgets/blue">
<link rel="alternate" hreflang="de" href="https://example.com/de/widgets/blue">
<meta property="og:title" content="Blue Widgets"><meta property="og:image" content="https://example.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@type":"Product"}</script>
<!-- <title>commented out</title> -->
</head><body><h1>Blue <em>Widgets</em></h1><script>var t = "<title>no</title>";</script></body></html>`;
const codes = (l) => l.map((i) => i.code);

test('extracts metadata and resolves relative URLs', () => {
  const m = extractMeta(GOOD, 'https://example.com/widgets/blue');
  assert.equal(m.title, 'Blue Widgets for Small Workshops & Garages');
  assert.equal(m.titleCount, 1);
  assert.deepEqual(m.canonical, ['https://example.com/widgets/blue']);
  assert.equal(m.lang, 'en');
  assert.deepEqual(m.h1, ['Blue Widgets']);
  assert.equal(m.og['og:title'], 'Blue Widgets');
  assert.equal(m.twitter['twitter:card'], 'summary_large_image');
  assert.equal(m.hreflang[0].hreflang, 'de');
  assert.equal(m.jsonLd, 1);
});

test('a well-formed page has no warnings', () => {
  const issues = lintMeta(extractMeta(GOOD, 'https://example.com/widgets/blue'), { url: 'https://example.com/widgets/blue' });
  assert.deepEqual(issues.filter((i) => i.level !== 'info'), []);
});

test('flags missing and oversized tags', () => {
  const c = codes(lintMeta(extractMeta('<html><head><title>Hi</title><title>Again</title></head><body></body></html>')));
  for (const code of ['title-short', 'title-multiple', 'description-missing', 'viewport-missing', 'h1-missing', 'lang-missing']) assert.ok(c.includes(code), code);
  const long = `<title>${'x'.repeat(80)}</title><meta name="description" content="${'y'.repeat(200)}">`;
  const c2 = codes(lintMeta(extractMeta(long)));
  assert.ok(c2.includes('title-long'));
  assert.ok(c2.includes('description-long'));
});

test('detects noindex in meta and X-Robots-Tag, and duplicate canonicals', () => {
  assert.ok(codes(lintMeta(extractMeta('<meta name="robots" content="noindex, nofollow">'))).includes('noindex'));
  assert.ok(codes(lintMeta(extractMeta('<title>x</title>'), { xRobotsTag: 'noindex' })).includes('noindex'));
  assert.ok(codes(lintMeta(extractMeta('<link rel="canonical" href="/a"><link rel="canonical" href="/b">', 'https://e.com/'))).includes('canonical-multiple'));
});

test('fetches and analyses a URL', async () => {
  const r = await analyzeMeta('example.com/widgets/blue', { fetch: async () => new Response(GOOD, { status: 200, headers: { 'x-robots-tag': 'noarchive' } }) });
  assert.equal(r.url, 'https://example.com/widgets/blue');
  assert.equal(r.xRobotsTag, 'noarchive');
  assert.equal(r.ok, true);
  const missing = await analyzeMeta('https://example.com/x', { fetch: async () => new Response('gone', { status: 404 }) });
  assert.ok(codes(missing.issues).includes('http-error'));
});
