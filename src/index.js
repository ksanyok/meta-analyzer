import { tags, text, strip, metaMap, first } from './html.js';

export { metaMap } from './html.js';

/**
 * Extract SEO-relevant metadata from an HTML document.
 * @param {string} html
 * @param {string} [url] the page URL, used to resolve relative links
 */
export function extractMeta(html, url) {
  const clean = strip(html);
  const head = /<head\b[\s\S]*?<\/head>/i.exec(clean)?.[0] || clean;
  const meta = metaMap(head);
  const links = tags(head, 'link');
  const abs = (h) => { try { return url ? new URL(h, url).toString() : h; } catch { return h; } };
  const rel = (r) => links.filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes(r));
  const htmlTag = tags(clean, 'html')[0] || {};
  const body = /<body\b[\s\S]*$/i.exec(clean)?.[0] || '';
  return {
    title: text(head, 'title'),
    titleCount: (head.match(/<title\b/gi) || []).length,
    description: first(meta.description) ?? null,
    descriptionCount: [].concat(meta.description ?? []).length,
    robots: first(meta.robots) ?? null,
    googlebot: first(meta.googlebot) ?? null,
    canonical: rel('canonical').map((l) => abs(l.href)),
    viewport: first(meta.viewport) ?? null,
    charset: (tags(head, 'meta').find((m) => m.charset) || {}).charset || null,
    lang: htmlTag.lang || null,
    hreflang: rel('alternate').filter((l) => l.hreflang).map((l) => ({ hreflang: l.hreflang, href: abs(l.href) })),
    h1: (body.match(/<h1\b[\s\S]*?<\/h1>/gi) || []).map((h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()),
    og: Object.fromEntries(Object.entries(meta).filter(([k]) => k.startsWith('og:')).map(([k, v]) => [k, first(v)])),
    twitter: Object.fromEntries(Object.entries(meta).filter(([k]) => k.startsWith('twitter:')).map(([k, v]) => [k, first(v)])),
    jsonLd: (String(html).match(/<script[^>]+application\/ld\+json[^>]*>/gi) || []).length,
    favicon: rel('icon').concat(rel('shortcut')).map((l) => abs(l.href))[0] || null,
  };
}

/** Lint extracted metadata. */
export function lintMeta(m, context = {}) {
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  if (!m.title) add('error', 'title-missing', 'No <title>. It is the headline of your search result.');
  else {
    if (m.title.length < 20) add('warning', 'title-short', `Title is ${m.title.length} characters; aim for 30–60.`);
    if (m.title.length > 60) add('warning', 'title-long', `Title is ${m.title.length} characters; Google usually cuts it after ~60 (580 px).`);
  }
  if (m.titleCount > 1) add('warning', 'title-multiple', `${m.titleCount} <title> elements; only the first is used.`);
  if (!m.description) add('warning', 'description-missing', 'No meta description: Google will pick a snippet from the page text.');
  else {
    if (m.description.length < 70) add('info', 'description-short', `Meta description is ${m.description.length} characters; 120–160 uses the space you get.`);
    if (m.description.length > 160) add('warning', 'description-long', `Meta description is ${m.description.length} characters; it will be truncated after ~155–160.`);
  }
  if (m.descriptionCount > 1) add('warning', 'description-multiple', `${m.descriptionCount} meta descriptions.`);
  const robots = `${m.robots || ''},${m.googlebot || ''},${context.xRobotsTag || ''}`.toLowerCase();
  if (/noindex/.test(robots)) add('error', 'noindex', `The page is set to noindex (${[m.robots, m.googlebot, context.xRobotsTag].filter(Boolean).join(' / ')}): it will not appear in search.`);
  if (/nofollow/.test(robots)) add('warning', 'nofollow', 'Links on this page are nofollow.');
  if (!m.canonical.length) add('info', 'canonical-missing', 'No canonical link.');
  else if (m.canonical.length > 1) add('error', 'canonical-multiple', `${m.canonical.length} canonical links; Google may ignore all of them.`);
  else if (context.url && m.canonical[0].replace(/\/$/, '') !== context.url.replace(/[?#].*$/, '').replace(/\/$/, '')) add('info', 'canonical-other', `Canonical points to another URL: ${m.canonical[0]}`);
  if (!m.viewport) add('warning', 'viewport-missing', 'No viewport meta tag: the page is not mobile-friendly.');
  if (!m.lang) add('info', 'lang-missing', 'No lang attribute on <html>.');
  if (!m.charset) add('info', 'charset-missing', 'No <meta charset>.');
  if (m.h1.length === 0) add('warning', 'h1-missing', 'No <h1> heading.');
  else if (m.h1.length > 1) add('info', 'h1-multiple', `${m.h1.length} <h1> headings.`);
  if (!m.og['og:title'] || !m.og['og:image']) add('info', 'og-incomplete', 'Open Graph title or image missing: shared links will look plain.');
  return out;
}

/**
 * Fetch a page and analyse its meta tags.
 * @param {string} url
 * @param {{fetch?: typeof fetch, userAgent?: string}} [options]
 */
export async function analyzeMeta(url, options = {}) {
  const doFetch = options.fetch || globalThis.fetch;
  const start = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).toString();
  const res = await doFetch(start, { redirect: 'follow', headers: { 'user-agent': options.userAgent || 'Mozilla/5.0 (compatible; meta-analyzer; +https://github.com/ksanyok/meta-analyzer)', accept: 'text/html' } });
  const finalUrl = res.url || start;
  const html = await res.text();
  const meta = extractMeta(html, finalUrl);
  const xRobotsTag = res.headers.get('x-robots-tag');
  const issues = lintMeta(meta, { url: finalUrl, xRobotsTag });
  if (res.status >= 400) issues.unshift({ level: 'error', code: 'http-error', message: `The page returned HTTP ${res.status}.` });
  return { url: start, finalUrl, status: res.status, xRobotsTag, meta, issues, ok: !issues.some((i) => i.level === 'error') };
}
