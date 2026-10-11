// Capture a normalized snapshot of key pages and API responses, or diff two
// snapshots. Used to prove a refactor leaves the NBA site unchanged.
//
//   npx tsx scripts/verify/snapshot-pages.ts snapshot http://localhost:3100 .verify/baseline
//   npx tsx scripts/verify/snapshot-pages.ts diff .verify/baseline .verify/after
//
// Each URL becomes one JSON file holding: HTTP status, redirect target, title,
// meta tags, visible text, sorted link hrefs and sorted image srcs (HTML), or
// the parsed body (JSON). Volatile bits (build chunk names, today's date,
// freeze timestamps) are normalized away.

import { promises as fs } from 'fs';
import path from 'path';

const NBA_ARCHIVED = [
  '2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', '2018-19',
  '2017-18', '2016-17', '2015-16', '2014-15', '2013-14', '2012-13', '2011-12', '2010-11',
];
const NBA_ALL = ['2026-27', ...NBA_ARCHIVED];

export function nbaBaselineUrls(): string[] {
  const urls: string[] = ['/', '/history'];
  for (const s of NBA_ALL) {
    urls.push(`/seasons/${s}`, `/seasons/${s}/standings`, `/seasons/${s}/players`, `/seasons/${s}/teams`);
  }
  for (const s of NBA_ARCHIVED) {
    urls.push(`/api/standings?season=${s}`, `/api/player-stats-leaders?season=${s}&limit=30`);
  }
  for (const s of ['2026-27', '2025-26', '2015-16', '2010-11']) {
    for (const t of ['det', 'gs', 'ny']) urls.push(`/seasons/${s}/teams/${t}`);
  }
  for (const p of ['3975', '1966', '3945274', '3112335']) {
    urls.push(`/seasons/2025-26/players/${p}`, `/seasons/2015-16/players/${p}`);
  }
  urls.push(
    '/seasons/2025-26/games/401859963', '/seasons/2015-16/games/400878160',
    '/api/game/401859963', '/api/game/400878160',
    '/api/standings', '/api/player-stats-leaders?season=2026-27',
    '/api/players/search?q=curry',
    // Redirects and 404s
    '/teams', '/players', '/standings', '/players/1966', '/teams/det', '/games/401859963',
    '/seasons/1999-00', '/nope',
  );
  return urls;
}

type Snap = Record<string, unknown>;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

const DATE_RE = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/g;

function normalizeText(s: string): string {
  return s.replace(DATE_RE, '<DATE>').replace(/\s+/g, ' ').trim();
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:-]+)="([^"]*)"/g)) out[m[1]] = decode(m[2]);
  return out;
}

function parseHtml(html: string): Snap {
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((m) => attrs(m[0]))
    .filter((a) => (a.name || a.property) && a.content !== undefined)
    .map((a) => `${a.name || a.property}=${a.content}`)
    .sort();
  // Next.js may stream <title> into the body; drop it so the text is stable.
  const body = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '');
  const links = [...body.matchAll(/<a\b[^>]*>/g)]
    .map((m) => attrs(m[0]).href)
    .filter(Boolean)
    .sort();
  const imgs = [...body.matchAll(/<img\b[^>]*>/g)]
    .map((m) => attrs(m[0]).src)
    .filter(Boolean)
    .map((s) => s.replace(/\/_next\/static\/[^"]*/, '/_next/static/<chunk>'))
    .sort();
  const text = normalizeText(decode(body.replace(/<[^>]+>/g, ' ')));
  const refresh = html.match(/http-equiv="refresh" content="([^"]*)"/)?.[1];
  return { title, metas, links, imgs, text, ...(refresh ? { refresh } : {}) };
}

function normalizeJson(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalizeJson);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) {
      if (k === 'frozenAt') continue;
      out[k] = normalizeJson((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

async function snapOne(base: string, url: string): Promise<Snap> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(base + url, { redirect: 'manual', signal: AbortSignal.timeout(120_000) });
      const snap: Snap = { url, status: res.status };
      const loc = res.headers.get('location');
      if (loc) snap.location = loc.replace(base, '');
      const xs = res.headers.get('x-season-status');
      if (xs) snap.xSeasonStatus = xs;
      const type = res.headers.get('content-type') ?? '';
      const body = await res.text();
      if (type.includes('json')) {
        try { snap.json = normalizeJson(JSON.parse(body)); } catch { snap.raw = body.slice(0, 500); }
      } else if (type.includes('html')) {
        Object.assign(snap, parseHtml(body));
      } else {
        snap.contentType = type;
        snap.length = body.length;
      }
      return snap;
    } catch (err) {
      if (attempt === 3) return { url, error: String(err) };
    }
  }
  return { url, error: 'unreachable' };
}

function fileFor(url: string): string {
  return url.replace(/^\//, '').replace(/[^a-zA-Z0-9._-]+/g, '_') || 'root';
}

async function snapshot(base: string, outDir: string, urls: string[]) {
  await fs.mkdir(outDir, { recursive: true });
  const queue = [...urls];
  let done = 0;
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const url = queue.shift()!;
      const snap = await snapOne(base, url);
      await fs.writeFile(path.join(outDir, fileFor(url) + '.json'), JSON.stringify(snap, null, 2) + '\n');
      done++;
      if (snap.error || (typeof snap.status === 'number' && snap.status >= 500)) {
        console.log(`  ! ${url} -> ${snap.error ?? snap.status}`);
      }
    }
  });
  await Promise.all(workers);
  console.log(`Captured ${done} URLs into ${outDir}`);
}

function diffValue(a: unknown, b: unknown, p: string, out: string[]) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (typeof a === 'string' && typeof b === 'string') {
    // Show the first point of divergence for long strings.
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    out.push(`${p}: differs at ${i}\n    before: …${a.slice(Math.max(0, i - 60), i + 120)}\n    after:  …${b.slice(Math.max(0, i - 60), i + 120)}`);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const sa = new Set(a.map((x) => JSON.stringify(x)));
    const sb = new Set(b.map((x) => JSON.stringify(x)));
    const removed = [...sa].filter((x) => !sb.has(x));
    const added = [...sb].filter((x) => !sa.has(x));
    if (removed.length || added.length) {
      out.push(`${p}: -${removed.length} +${added.length}` +
        removed.slice(0, 5).map((x) => `\n    - ${x.slice(0, 200)}`).join('') +
        added.slice(0, 5).map((x) => `\n    + ${x.slice(0, 200)}`).join(''));
    } else {
      out.push(`${p}: same items, different order`);
    }
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
    for (const k of keys) diffValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${p}.${k}`, out);
    return;
  }
  out.push(`${p}: ${JSON.stringify(a)?.slice(0, 200)} -> ${JSON.stringify(b)?.slice(0, 200)}`);
}

// dirA may be "baseline,baseline2": a snapshot passes if it matches any of
// them. Two baseline runs of unchanged code capture ESPN's own flakiness.
async function diff(dirAList: string, dirB: string): Promise<number> {
  const dirAs = dirAList.split(',');
  const dirA = dirAs[0];
  const files = new Set([...(await fs.readdir(dirA)), ...(await fs.readdir(dirB))]);
  let changed = 0;
  for (const f of [...files].sort()) {
    const read = async (d: string) => {
      try { return JSON.parse(await fs.readFile(path.join(d, f), 'utf-8')); } catch { return undefined; }
    };
    const b = await read(dirB);
    const alts = await Promise.all(dirAs.map(read));
    if (alts.some((alt) => JSON.stringify(alt) === JSON.stringify(b))) continue;
    const a = alts[0];
    const out: string[] = [];
    diffValue(a, b, '', out);
    if (out.length) {
      changed++;
      console.log(`\n### ${f}\n  ${out.join('\n  ')}`);
    }
  }
  console.log(`\n${changed} of ${files.size} snapshots differ.`);
  return changed;
}

async function main() {
  const [mode, a, b] = process.argv.slice(2);
  if (mode === 'snapshot' && a && b) {
    await snapshot(a.replace(/\/$/, ''), b, nbaBaselineUrls());
  } else if (mode === 'diff' && a && b) {
    const changed = await diff(a, b);
    process.exit(changed ? 1 : 0);
  } else {
    console.error('Usage: snapshot <baseUrl> <outDir> | diff <dirA> <dirB>');
    process.exit(2);
  }
}

if (process.argv[1]?.endsWith('snapshot-pages.ts')) main();
