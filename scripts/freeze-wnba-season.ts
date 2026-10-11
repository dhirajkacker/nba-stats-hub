// Freeze a WNBA season to data/wnba/seasons/<YYYY>/{standings,playoffs,leaders,meta}.json.
//
//   npm run freeze-season -- --league wnba 2025
//   npm run freeze-season -- --league wnba 2010 2011 2012   (several seasons)
//
// Every season is validated (scripts/verify/wnba-data.ts checks) before
// anything is written; a failing season writes nothing and the script exits
// non-zero. The champion, runner-up and Finals score come from ESPN's playoff
// results and must match lib/wnba/seasons.ts, which also supplies the Finals
// MVP. Raw ESPN responses are cached in .cache/espn so re-runs are cheap.

import { promises as fs } from 'fs';
import path from 'path';

process.env.ESPN_CACHE_DIR ??= path.join(process.cwd(), '.cache', 'espn');

import { fetchWnbaStandings } from '../lib/wnba/standings';
import { buildWnbaPlayoffs, wnbaFinalsResult, type WnbaPlayoffTeam } from '../lib/wnba/playoffs';
import { fetchWnbaLeaders } from '../lib/wnba/leaders';
import { wnbaSeasonFacts } from '../lib/wnba/seasons';
import type { SeasonMeta, SeasonTeamRef } from '../lib/season-context';
import { checkWnbaSeason } from './verify/wnba-data';

function teamRef(t: WnbaPlayoffTeam): SeasonTeamRef {
  return {
    tricode: t.abbrev,
    city: t.name.slice(0, t.name.length - t.shortName.length).trim(),
    name: t.shortName,
    teamId: t.id,
    logo: t.logo,
  };
}

async function freezeOne(season: string): Promise<boolean> {
  const facts = wnbaSeasonFacts(season);
  if (!facts) {
    console.error(`${season}: not in lib/wnba/seasons.ts`);
    return false;
  }
  if (!facts.champion) {
    console.error(`${season}: the season table has no champion yet. Add it (with the Finals MVP) once the Finals end.`);
    return false;
  }

  console.log(`\nFreezing WNBA ${season}…`);
  const standings = await fetchWnbaStandings(season);
  if (!standings) {
    console.error(`  ✗ no standings from ESPN`);
    return false;
  }
  const playoffs = await buildWnbaPlayoffs(season, standings.standings, { now: new Date(`${parseInt(season, 10) + 1}-01-01`) });
  const { leaders } = await fetchWnbaLeaders(season, standings.standings, 25);

  const { failures, notes } = await checkWnbaSeason(season, { standings, playoffs, leaders });
  for (const n of notes) console.log(`  · ${n}`);
  if (failures.length) {
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(`  Nothing written for ${season}.`);
    return false;
  }

  const result = wnbaFinalsResult(playoffs)!;
  const meta: SeasonMeta & { league: 'wnba' } = {
    league: 'wnba',
    season,
    champion: teamRef(result.champion),
    runnerUp: teamRef(result.runnerUp),
    finalsScore: result.score,
    ...(facts.finalsMVP ? { finalsMVP: facts.finalsMVP } : {}),
    frozen: true,
    frozenAt: new Date().toISOString(),
  };

  const dir = path.join(process.cwd(), 'data', 'wnba', 'seasons', season);
  await fs.mkdir(dir, { recursive: true });
  const write = (file: string, value: unknown) => fs.writeFile(path.join(dir, file), JSON.stringify(value, null, 2) + '\n');
  await write('standings.json', standings);
  await write('playoffs.json', playoffs);
  await write('leaders.json', leaders);
  await write('meta.json', meta);
  console.log(`  ✓ ${standings.standings.length} teams, ${playoffs.rounds.reduce((n, r) => n + r.series.length, 0)} series, ${leaders.length} leaders`);
  console.log(`  ✓ ${meta.champion!.city} ${meta.champion!.name} def. ${meta.runnerUp!.city} ${meta.runnerUp!.name} ${meta.finalsScore}, Finals MVP ${meta.finalsMVP}`);
  return true;
}

export async function freezeWnba(seasons: string[]) {
  if (!seasons.length) {
    console.error('Usage: npm run freeze-season -- --league wnba <YYYY> [<YYYY> ...]');
    process.exit(1);
  }
  let ok = 0;
  for (const s of seasons) if (await freezeOne(s)) ok++;
  console.log(`\n${ok}/${seasons.length} seasons frozen.`);
  if (ok !== seasons.length) process.exit(1);
}
