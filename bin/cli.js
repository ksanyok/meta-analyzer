#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { analyzeMeta, extractMeta, lintMeta } from '../src/index.js';

const HELP = `Usage: meta-analyzer <url> [options]
       meta-analyzer --file page.html

Fetches a page and audits its SEO meta tags: title, meta description, robots
and X-Robots-Tag, canonical, viewport, lang, charset, H1, hreflang, Open Graph
and Twitter cards.

Options:
  --file <path>     Analyse a local HTML file
  --ua <agent>      User agent to send
  --json            Print JSON
  --strict          Exit with code 1 on warnings too
  -h, --help        Show this help

Online version (no install): https://promopilot.link/en/tools/meta-analyzer.php
`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!args.length || flag('-h') || flag('--help')) { process.stdout.write(HELP); process.exit(args.length ? 0 : 2); }

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const ICON = { error: c(31, '✖'), warning: c(33, '!'), info: c(36, 'i') };
const valued = new Set(['--file', '--ua']);
const cut = (s, n = 100) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

try {
  let report;
  if (value('--file')) {
    const meta = extractMeta(readFileSync(value('--file'), 'utf8'));
    const issues = lintMeta(meta);
    report = { file: value('--file'), meta, issues, ok: !issues.some((i) => i.level === 'error') };
  } else {
    report = await analyzeMeta(args.find((a, i) => !a.startsWith('-') && !valued.has(args[i - 1])), { userAgent: value('--ua') });
  }
  if (flag('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    const m = report.meta;
    const row = (k, v, extra = '') => console.log(`  ${c(1, k.padEnd(13))} ${v ?? c(2, '(none)')}${extra ? c(2, `  ${extra}`) : ''}`);
    if (report.finalUrl) console.log(`${c(1, 'URL:')} ${report.finalUrl}  (HTTP ${report.status})\n`);
    row('Title', cut(m.title), m.title ? `${m.title.length} chars` : '');
    row('Description', cut(m.description), m.description ? `${m.description.length} chars` : '');
    row('Robots', [m.robots, report.xRobotsTag && `X-Robots-Tag: ${report.xRobotsTag}`].filter(Boolean).join(' / ') || null);
    row('Canonical', m.canonical.join(', ') || null);
    row('H1', cut(m.h1[0]), m.h1.length > 1 ? `+${m.h1.length - 1} more` : '');
    row('Lang', m.lang);
    row('Viewport', m.viewport);
    row('Hreflang', m.hreflang.length ? m.hreflang.map((h) => h.hreflang).join(', ') : null);
    row('Open Graph', Object.keys(m.og).length ? Object.keys(m.og).join(', ') : null);
    row('Twitter', Object.keys(m.twitter).length ? Object.keys(m.twitter).join(', ') : null);
    console.log('');
    if (!report.issues.length) console.log(c(32, '✔ Meta tags look good'));
    for (const i of report.issues) console.log(`  ${ICON[i.level]} ${i.message}`);
  }
  const failing = report.issues.filter((i) => i.level === 'error' || (flag('--strict') && i.level === 'warning'));
  process.exit(failing.length ? 1 : 0);
} catch (err) {
  console.error(c(31, `Error: ${err.message}`));
  process.exit(2);
}
