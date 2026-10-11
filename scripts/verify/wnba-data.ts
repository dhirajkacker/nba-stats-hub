// Validate the WNBA data layer against the hand-checked season table.
//
//   npx tsx scripts/verify/wnba-data.ts            # every season in the table
//   npx tsx scripts/verify/wnba-data.ts 2010 2016  # specific seasons
//   SNAPSHOTS=1 npx tsx scripts/verify/wnba-data.ts  # check data/wnba snapshots instead of ESPN
//
// Raw ESPN responses are cached in .cache/espn (set ESPN_CACHE_DIR to change).
// Exits non-zero if any check fails.

import { promises as fs } from 'fs';
import path from 'path';

process.env.ESPN_CACHE_DIR ??= path.join(process.cwd(), '.cache', 'espn');

import type { Standings } from '../../lib/types';
import { fetchWnbaStandings } from '../../lib/wnba/standings';
import { buildWnbaPlayoffs, wnbaFinalsResult, type WnbaPlayoffs } from '../../lib/wnba/playoffs';
import { fetchWnbaLeaders, type WnbaLeader } from '../../lib/wnba/leaders';
import { WNBA_SEASON_FACTS, wnbaSeasonFacts } from '../../lib/wnba/seasons';

const logoStatus = new Map<string, number>();
async function urlStatus(url: string): Promise<number> {
  if (logoStatus.has(url)) return logoStatus.get(url)!;
  let status = 0;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15_000) });
    status = res.ok && (res.headers.get('content-type') ?? '').startsWith('image/') ? res.status : res.status || 1;
  } catch {
    status = 0;
  }
  logoStatus.set(url, status);
  return status;
}

async function readSnap<T>(season: string, file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join('data', 'wnba', 'seasons', season, file), 'utf-8'));
  } catch {
    return null;
  }
}

export interface SeasonData {
  standings: Standings | null;
  playoffs: WnbaPlayoffs | null;
  leaders: WnbaLeader[];
}

/** All checks for one season. Returns a list of failures (empty = pass). */
export async function checkWnbaSeason(season: string, data: SeasonData): Promise<{ failures: string[]; notes: string[] }> {
  const failures: string[] = [];
  const notes: string[] = [];
  const facts = wnbaSeasonFacts(season);
  if (!facts) return { failures: [`${season} is not in the season table`], notes };

  // Standings
  const rows = data.standings?.standings ?? [];
  if (!rows.length) failures.push('no standings');
  if (rows.length !== facts.teams) failures.push(`${rows.length} teams, table says ${facts.teams}`);
  const w = rows.reduce((a, t) => a + t.wins, 0);
  const l = rows.reduce((a, t) => a + t.losses, 0);
  if (w !== l) failures.push(`total wins ${w} != total losses ${l}`);
  const finished = !!facts.champion;
  for (const t of rows) {
    if (finished && t.wins + t.losses !== facts.games) failures.push(`${t.teamTricode} played ${t.wins + t.losses}, table says ${facts.games}`);
    if (!t.teamTricode || !t.teamCity || !t.teamName) failures.push(`team ${t.teamId} missing a name or abbreviation`);
  }
  if (new Set(rows.map((t) => t.teamId)).size !== rows.length) failures.push('duplicate team ids');

  // Seeds
  const seeded = rows.filter((t) => t.playoffSeed);
  if (facts.seeding === 'league') {
    const seeds = seeded.map((t) => t.playoffSeed!).sort((a, b) => a - b);
    const expected = rows.map((_, i) => i + 1);
    if (JSON.stringify(seeds) !== JSON.stringify(expected)) failures.push(`league seeds are not 1..${rows.length}: ${seeds}`);
  } else {
    for (const conf of ['East', 'West'] as const) {
      const seeds = rows.filter((t) => t.conference === conf).map((t) => t.playoffSeed ?? 0).sort((a, b) => a - b);
      if (seeds.slice(0, 4).join() !== '1,2,3,4') failures.push(`${conf} seeds don't start 1-4: ${seeds}`);
    }
  }

  // Logos (null is allowed; it renders an initials badge)
  for (const t of rows) {
    if (!t.logo) {
      notes.push(`${t.teamTricode} has no logo (badge)`);
      continue;
    }
    const status = await urlStatus(t.logo);
    if (status !== 200) failures.push(`${t.teamTricode} logo returns ${status}: ${t.logo}`);
  }

  // Playoffs
  const p = data.playoffs;
  if (!p) failures.push('no playoffs');
  else {
    for (const issue of p.issues) failures.push(`playoffs: ${issue}`);
    if (p.format !== facts.format) failures.push(`format ${p.format}, table says ${facts.format}`);
    const result = wnbaFinalsResult(p);
    if (finished) {
      if (!result) failures.push('Finals not complete');
      else {
        if (result.champion.name !== facts.champion) failures.push(`champion ${result.champion.name}, table says ${facts.champion}`);
        if (result.runnerUp.name !== facts.runnerUp) failures.push(`runner-up ${result.runnerUp.name}, table says ${facts.runnerUp}`);
        if (result.score !== facts.finalsScore) failures.push(`Finals ${result.score}, table says ${facts.finalsScore}`);
      }
    } else if (result) {
      notes.push(`live season has a finished Finals: ${result.champion.name} ${result.score}`);
    }
    // Every playoff team is seeded inside the playoff line.
    const line = facts.seeding === 'league' ? 8 : 4;
    for (const r of p.rounds) {
      if (r.series.length > r.expected) failures.push(`${r.name}: ${r.series.length} series, more than ${r.expected}`);
      for (const s of r.series) {
        for (const t of [s.teamA, s.teamB]) {
          if (!t.seed || t.seed > line) failures.push(`${r.name}: ${t.abbrev} has seed ${t.seed}, outside the top ${line}`);
          if (!rows.some((row) => String(row.teamId) === t.id)) failures.push(`${r.name}: ${t.abbrev} not in standings`);
        }
      }
    }
  }

  // Leaders
  const leaders = data.leaders;
  if (leaders.length < 20) failures.push(`only ${leaders.length} leaders`);
  for (let i = 1; i < leaders.length; i++) {
    if (leaders[i - 1].stats.ppg < leaders[i].stats.ppg) failures.push(`leaders not sorted at #${i + 1}`);
  }
  for (const ld of leaders) {
    if (!ld.displayName) failures.push(`leader ${ld.id} has no name`);
    if (!rows.some((t) => String(t.teamId) === ld.team.id)) failures.push(`leader ${ld.displayName} team ${ld.team.abbreviation}/${ld.team.id} not in standings`);
  }
  const noHeadshot = leaders.filter((ld) => !ld.headshot).length;
  if (noHeadshot) notes.push(`${noHeadshot}/${leaders.length} leaders have no headshot (placeholder)`);

  return { failures, notes };
}

async function loadFromEspn(season: string): Promise<SeasonData> {
  const standings = await fetchWnbaStandings(season);
  const playoffs = standings ? await buildWnbaPlayoffs(season, standings.standings) : null;
  const leaders = standings ? (await fetchWnbaLeaders(season, standings.standings, 25)).leaders : [];
  return { standings, playoffs, leaders };
}

async function loadFromSnapshots(season: string): Promise<SeasonData> {
  return {
    standings: await readSnap<Standings>(season, 'standings.json'),
    playoffs: await readSnap<WnbaPlayoffs>(season, 'playoffs.json'),
    leaders: (await readSnap<WnbaLeader[]>(season, 'leaders.json')) ?? [],
  };
}

async function main() {
  const args = process.argv.slice(2);
  const seasons = args.length ? args : WNBA_SEASON_FACTS.map((f) => f.season);
  const fromSnapshots = !!process.env.SNAPSHOTS;
  let failed = 0;
  for (const season of seasons) {
    const data = fromSnapshots ? await loadFromSnapshots(season) : await loadFromEspn(season);
    const { failures, notes } = await checkWnbaSeason(season, data);
    const top = data.leaders[0];
    const res = data.playoffs ? wnbaFinalsResult(data.playoffs) : null;
    console.log(
      `${failures.length ? 'FAIL' : 'ok  '} ${season}: ${data.standings?.standings.length ?? 0} teams, ` +
      `${res ? `${res.champion.abbrev} ${res.score} ${res.runnerUp.abbrev}` : 'Finals pending'}, ` +
      `#1 scorer ${top ? `${top.displayName} ${top.stats.ppg.toFixed(1)}` : '-'}`,
    );
    for (const f of failures) console.log(`       ✗ ${f}`);
    for (const n of notes) console.log(`       · ${n}`);
    if (failures.length) failed++;
  }
  console.log(`\n${seasons.length - failed}/${seasons.length} seasons pass.`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1]?.endsWith('wnba-data.ts')) main();
