// Crawl the running site and check cross-linking, league isolation and images.
//
//   npx tsx scripts/verify/crawl.ts http://localhost:3100            # WNBA seasons + NBA sample
//   npx tsx scripts/verify/crawl.ts http://localhost:3100 --wnba 2010 2016
//
// Client-rendered pages (players list, teams list, game pages) are rendered
// in headless Chrome so their real links are checked. Exits non-zero on any
// failure.

import { execFile } from 'child_process';
import { promisify } from 'util';
import { LEAGUES } from '../../lib/leagues';
import { getWnbaSeasonPlayoffs, getWnbaSeasonStandings } from '../../lib/wnba/season-context';
import { getTeamGameLog } from '../../lib/espn-team-stats';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const BASE = (args[0] ?? 'http://localhost:3100').replace(/\/$/, '');
const wnbaIdx = args.indexOf('--wnba');
const WNBA_SEASONS = wnbaIdx >= 0 ? args.slice(wnbaIdx + 1).filter((a) => /^\d{4}$/.test(a)) : [...LEAGUES.wnba.knownSeasons];
const NBA_SEASONS = args.includes('--no-nba') ? [] : ['2026-27', '2025-26', '2015-16'];
const MAX_DEPTH = 3;
const CONCURRENCY = 4;

interface Page { path: string; depth: number; from: string }
const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);
const visited = new Set<string>();
const imageUrls = new Map<string, string>(); // url -> first page seen on
const teamIdsBySeason = new Map<string, Set<string>>();
let pagesChecked = 0;
let chromeRendered = 0;

function leagueOf(path: string): 'nba' | 'wnba' {
  return path === '/wnba' || path.startsWith('/wnba/') ? 'wnba' : 'nba';
}
function seasonOf(path: string): string | null {
  return path.match(/^\/wnba\/seasons\/(\d{4})/)?.[1] ?? path.match(/^\/seasons\/(\d{4}-\d{2})/)?.[1] ?? null;
}
const isClientRendered = (path: string) =>
  /\/seasons\/[^/]+\/(players|teams)\/?$/.test(path) || /\/seasons\/[^/]+\/games\/\d+$/.test(path);

function decode(s: string) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

async function fetchHtml(path: string): Promise<{ status: number; html: string; location?: string }> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(BASE + path, { redirect: 'manual', signal: AbortSignal.timeout(120_000) });
      return { status: res.status, html: await res.text(), location: res.headers.get('location') ?? undefined };
    } catch (err) {
      if (attempt === 3) return { status: 0, html: String(err) };
    }
  }
  return { status: 0, html: '' };
}

// One Chrome at a time: parallel headless instances starve each other and
// dump the DOM before client data arrives.
let chromeQueue: Promise<unknown> = Promise.resolve();
const LOADING = /Loading (top scorers|teams)\.\.\.|animate-spin rounded-full h-12/;

async function renderOnce(path: string, budgetMs: number): Promise<string> {
  const { stdout } = await run(CHROME, [
    '--headless=new', '--disable-gpu', `--virtual-time-budget=${budgetMs}`, '--dump-dom', BASE + path,
  ], { maxBuffer: 50 * 1024 * 1024, timeout: 180_000 });
  return stdout;
}

async function renderWithChrome(path: string): Promise<string> {
  const job = chromeQueue.then(async () => {
    chromeRendered++;
    let html = '';
    for (const budget of [20_000, 40_000, 60_000]) {
      html = await renderOnce(path, budget);
      if (!LOADING.test(html)) break;
    }
    return html;
  });
  chromeQueue = job.catch(() => undefined);
  return job;
}

async function wnbaTeamIds(season: string): Promise<Set<string>> {
  if (!teamIdsBySeason.has(season)) {
    const res = await fetch(`${BASE}/api/standings?league=wnba&season=${season}`);
    const data = await res.json();
    if (data.season !== season) fail(`/api/standings?league=wnba&season=${season} returned season ${data.season}`);
    teamIdsBySeason.set(season, new Set((data.standings ?? []).map((t: { teamId: number }) => String(t.teamId))));
  }
  return teamIdsBySeason.get(season)!;
}

async function checkPage(page: Page, enqueue: (p: Page) => void) {
  const { path } = page;
  const league = leagueOf(path);
  const season = seasonOf(path);
  const res = await fetchHtml(path);
  pagesChecked++;

  if (res.status >= 300 && res.status < 400) {
    if (res.location) enqueue({ path: new URL(res.location, BASE).pathname, depth: page.depth, from: path });
    return;
  }
  if (res.status !== 200) return fail(`${path} returned ${res.status} (linked from ${page.from})`);
  if (res.html.includes('NEXT_HTTP_ERROR_FALLBACK;404')) return fail(`${path} is a not-found page (linked from ${page.from})`);

  let html = res.html;
  if (isClientRendered(path)) {
    html = await renderWithChrome(path);
    if (LOADING.test(html)) fail(`${path} was still loading after three renders`);
    if (/Failed to load|Game not found|No player data available/.test(html)) fail(`${path} rendered an error state`);
  }

  // League switch: exactly two links, one per league, the active one first-class.
  const switches = [...html.matchAll(/<a\b[^>]*data-league-switch="(nba|wnba)"[^>]*>/g)];
  if (switches.length !== 2) fail(`${path}: expected 2 league-switch links, found ${switches.length}`);
  for (const m of switches) {
    const href = decode(m[0].match(/href="([^"]*)"/)?.[1] ?? '');
    const target = m[1];
    if (target === 'wnba' && !href.startsWith('/wnba')) fail(`${path}: WNBA switch link goes to ${href}`);
    if (target === 'nba' && href.startsWith('/wnba')) fail(`${path}: NBA switch link goes to ${href}`);
    const isActive = /aria-current="page"/.test(m[0]);
    if (isActive !== (target === league)) fail(`${path}: switch marks ${target} active=${isActive}`);
    enqueue({ path: href, depth: MAX_DEPTH, from: `${path} (switch)` }); // check it resolves, don't crawl past it
  }

  const body = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<a\b[^>]*data-league-switch[^>]*>[\s\S]*?<\/a>/g, '');

  // Wording
  const text = decode(body.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' '));
  if (league === 'wnba' && /\bNBA\b/.test(text)) {
    const at = text.search(/\bNBA\b/);
    fail(`${path}: WNBA page mentions "NBA": …${text.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, ' ')}…`);
  }

  // Links
  const hrefs = [...body.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => decode(m[1]));
  const teamIds = league === 'wnba' && season ? await wnbaTeamIds(season) : null;
  for (const href of hrefs) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.split('#')[0].split('?')[0];
    if (league === 'wnba' && !target.startsWith('/wnba')) fail(`${path}: WNBA page links outside /wnba: ${href}`);
    if (league === 'nba' && target.startsWith('/wnba')) fail(`${path}: NBA page links into /wnba: ${href}`);

    const deep = target.match(/^(?:\/wnba)?\/seasons\/([^/]+)\/(teams|players|games)\/([^/]+)$/);
    if (deep && season && deep[1] !== season) fail(`${path}: link to another season's ${deep[2]}: ${href}`);
    if (league === 'wnba' && deep?.[2] === 'teams') {
      if (!/^\d+$/.test(deep[3])) fail(`${path}: WNBA team link isn't a franchise id: ${href}`);
      else if (teamIds && deep[1] === season && !teamIds.has(deep[3])) fail(`${path}: team ${deep[3]} isn't in the ${season} standings: ${href}`);
    }
    enqueue({ path: target, depth: page.depth + 1, from: path });
  }

  // Images
  for (const m of body.matchAll(/<img\b[^>]*src="([^"]*)"/g)) {
    const src = decode(m[1]);
    if (!/^https?:/.test(src)) continue;
    if (league === 'wnba' && /\/(teamlogos|headshots)\/nba\//.test(src)) fail(`${path}: NBA image on a WNBA page: ${src}`);
    if (league === 'nba' && /\/(teamlogos|headshots)\/wnba\//.test(src)) fail(`${path}: WNBA image on an NBA page: ${src}`);
    if (!imageUrls.has(src)) imageUrls.set(src, path);
  }
}

async function crawl(starts: string[]) {
  const queue: Page[] = starts.map((p) => ({ path: p, depth: 0, from: 'start' }));
  const enqueue = (p: Page) => {
    if (p.depth > MAX_DEPTH || visited.has(p.path)) return;
    // Season nav pills and history links lead to other seasons: check they
    // resolve, but don't crawl other seasons' trees from here.
    queue.push(p);
  };
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const page = queue.shift()!;
      if (visited.has(page.path)) continue;
      visited.add(page.path);
      const startSeason = seasonOf(page.from) ?? null;
      const s = seasonOf(page.path);
      const crossSeason = startSeason && s && s !== startSeason;
      try {
        await checkPage(crossSeason ? { ...page, depth: MAX_DEPTH } : page, enqueue);
      } catch (err) {
        fail(`${page.path}: crawler error ${String(err).slice(0, 200)}`);
      }
      if (pagesChecked % 50 === 0) process.stdout.write(`  …${pagesChecked} pages\n`);
    }
  });
  await Promise.all(workers);
}

async function checkImages() {
  const urls = [...imageUrls.keys()];
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < urls.length) {
      const url = urls[i++];
      let lastError = '';
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
          const type = res.headers.get('content-type') ?? '';
          if (!res.ok || !type.startsWith('image/')) fail(`image ${res.status} ${type}: ${url} (on ${imageUrls.get(url)})`);
          lastError = '';
          break;
        } catch (err) {
          lastError = String(err).slice(0, 80); // timeouts are retried
        }
      }
      if (lastError) fail(`image unreachable: ${url} (${lastError})`);
    }
  }));
}

async function checkNotFound() {
  const nbaGame = '401859963';
  const wnbaGame = '401820329';
  const cases = [
    `/wnba/seasons/2026/games/${nbaGame}`,
    `/seasons/2025-26/players/3149391`,
    '/wnba/seasons/2026/teams/lv',
    '/wnba/seasons/2026/teams/1',
    '/wnba/seasons/2010/teams/129689',
    '/wnba/seasons/2027',
    '/wnba/seasons/1999',
    '/seasons/2026',
    '/wnba/seasons/2026-27',
  ];
  for (const path of cases) {
    // Game pages are client-rendered: render and look for the error state.
    if (/\/games\//.test(path)) {
      const html = await renderWithChrome(path);
      if (!/Failed to load game data|Game not found/.test(html)) fail(`${path} should show a game error`);
      continue;
    }
    const res = await fetchHtml(path);
    const isNotFound = res.status === 404 || res.html.includes('NEXT_HTTP_ERROR_FALLBACK;404');
    if (!isNotFound) fail(`${path} should be not-found, got ${res.status}`);
  }
  const api = await fetch(`${BASE}/api/game/${wnbaGame}?league=nba`);
  if (api.status === 200) fail(`WNBA game ${wnbaGame} is served by the NBA game API`);
  const api2 = await fetch(`${BASE}/api/game/${wnbaGame}?league=wnba`);
  const data = await api2.json();
  if (data?.header?.league?.abbreviation !== 'WNBA') fail(`WNBA game API returned league ${data?.header?.league?.abbreviation}`);
}

async function main() {
  const starts: string[] = ['/wnba', '/wnba/history'];
  for (const s of WNBA_SEASONS) {
    starts.push(`/wnba/seasons/${s}`, `/wnba/seasons/${s}/standings`, `/wnba/seasons/${s}/players`, `/wnba/seasons/${s}/teams`);
  }
  // Game pages aren't reachable without clicks (bracket games expand on
  // click, scores load client-side), so seed every playoff game and the
  // last regular-season games of each team.
  for (const s of WNBA_SEASONS) {
    const playoffs = await getWnbaSeasonPlayoffs(s);
    for (const r of playoffs?.rounds ?? []) for (const x of r.series) for (const g of x.games) starts.push(`/wnba/seasons/${s}/games/${g.id}`);
    const standings = await getWnbaSeasonStandings(s);
    for (const t of (standings?.standings ?? []).slice(0, 4)) {
      const log = await getTeamGameLog('wnba', String(t.teamId), parseInt(s, 10), 2);
      for (const g of log) starts.push(`/wnba/seasons/${s}/games/${g.id}`);
    }
  }
  for (const s of NBA_SEASONS) starts.push(`/seasons/${s}`, `/seasons/${s}/standings`);
  if (NBA_SEASONS.length) starts.push('/', '/history');
  console.log(`Crawling ${BASE} from ${starts.length} start pages (depth ${MAX_DEPTH})…`);
  await crawl(starts);
  console.log(`Checked ${pagesChecked} pages (${chromeRendered} rendered in Chrome). Checking ${imageUrls.size} images…`);
  await checkImages();
  await checkNotFound();
  const byKind = new Map<string, number>();
  for (const f of failures) byKind.set(f.replace(/[\d]+/g, '#').slice(0, 60), (byKind.get(f.replace(/[\d]+/g, '#').slice(0, 60)) ?? 0) + 1);
  if (failures.length) {
    console.log(`\n${failures.length} failures:`);
    for (const f of failures.slice(0, 80)) console.log('  ✗ ' + f);
    if (failures.length > 80) console.log(`  … and ${failures.length - 80} more`);
  } else {
    console.log('\nAll checks passed.');
  }
  process.exit(failures.length ? 1 : 0);
}

main();
