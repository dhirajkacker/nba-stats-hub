// Freeze an NBA season to data/seasons/<season>/{standings,playoffs,leaders,meta}.json.
//
// Usage:
//   npm run freeze-season -- 2024-25
//   npm run freeze-season -- 2024-25 --mvp "Shai Gilgeous-Alexander"
//
// Idempotent. Safe to run multiple times: rewrites the four files. Preserves
// finalsMVP from a prior meta.json if --mvp isn't passed.

import { promises as fs } from 'fs';
import path from 'path';

import { getESPNStandingsBySeason } from '../lib/espn-api';
import { getPlayoffsData, type PlayoffsData, type PlayoffSeries } from '../lib/playoffs-api';
import { getTopPlayersByAllStats } from '../lib/espn-stats-leaders';
import { getTeamInfo } from '../lib/team-identifiers';
import {
  seasonRegularSeasonEndDate,
  seasonPostseasonAnchorDate,
  seasonToESPNYear,
} from '../lib/seasons';
import type { SeasonMeta } from '../lib/season-context';
import type { Standings } from '../lib/types';

function parseArgs(argv: string[]): { season: string; mvp?: string } {
  const args = argv.slice(2);
  const season = args.find((a) => /^\d{4}-\d{2}$/.test(a));
  if (!season) {
    console.error('Usage: npm run freeze-season -- <YYYY-YY>  [--mvp "Player Name"]');
    console.error('Example: npm run freeze-season -- 2024-25');
    process.exit(1);
  }
  const mvpIdx = args.indexOf('--mvp');
  const mvp = mvpIdx >= 0 ? args[mvpIdx + 1] : undefined;
  return { season, mvp };
}

function findChampionAndRunnerUp(playoffs: PlayoffsData): {
  finals?: PlayoffSeries;
  winner?: { tricode: string };
  loser?: { tricode: string };
  score?: string;
} {
  const finals = playoffs.series.find((s) => s.round === 'NBA Finals' && s.completed);
  if (!finals) return {};
  const winnerSide = finals.winsA === 4 ? 'A' : finals.winsB === 4 ? 'B' : null;
  if (!winnerSide) return { finals };
  const winner = winnerSide === 'A' ? finals.teamA : finals.teamB;
  const loser = winnerSide === 'A' ? finals.teamB : finals.teamA;
  const score = `${Math.max(finals.winsA, finals.winsB)}-${Math.min(finals.winsA, finals.winsB)}`;
  return {
    finals,
    winner: { tricode: winner.abbrev },
    loser: { tricode: loser.abbrev },
    score,
  };
}

function teamMeta(tricode: string, standings: Standings | null): SeasonMeta['champion'] {
  const info = getTeamInfo(tricode);
  if (info) return { tricode: info.tricode, city: info.city, name: info.name };
  // Fallback: search standings for a row whose tricode resolves to the same team.
  const row = standings?.standings.find((s) => s.teamTricode === tricode);
  if (row) return { tricode: row.teamTricode, city: row.teamCity, name: row.teamName };
  return { tricode, city: '', name: tricode };
}

async function readExistingMeta(outDir: string): Promise<SeasonMeta | null> {
  try {
    const raw = await fs.readFile(path.join(outDir, 'meta.json'), 'utf-8');
    return JSON.parse(raw) as SeasonMeta;
  } catch {
    return null;
  }
}

async function main() {
  const { season, mvp } = parseArgs(process.argv);
  const outDir = path.join(process.cwd(), 'data', 'seasons', season);
  await fs.mkdir(outDir, { recursive: true });
  console.log(`\nFreezing season ${season} → ${outDir}\n`);

  // 1. Standings — walk backwards from the regular-season end date, capturing
  // type-2 (regular season) games until we have all 30 teams.
  const rsEnd = seasonRegularSeasonEndDate(season);
  console.log(`[1/4] Standings (anchor: ${rsEnd})...`);
  const standings = await getESPNStandingsBySeason(rsEnd);
  if (!standings || standings.standings.length === 0) {
    console.error('  ✗ Failed to fetch standings — aborting');
    process.exit(1);
  }
  await fs.writeFile(
    path.join(outDir, 'standings.json'),
    JSON.stringify(standings, null, 2),
  );
  console.log(`  ✓ ${standings.standings.length} teams written\n`);

  // 2. Playoffs — anchor at the postseason window so the date scan picks up
  // play-in (type 5) and playoffs (type 3) events from this season only.
  const psAnchor = seasonPostseasonAnchorDate(season);
  console.log(`[2/4] Playoffs (anchor: ${psAnchor}, ±days)...`);
  const playoffs = await getPlayoffsData({
    anchorDate: psAnchor,
    daysBack: 90,
    daysForward: 30,
  });
  await fs.writeFile(
    path.join(outDir, 'playoffs.json'),
    JSON.stringify(playoffs, null, 2),
  );
  console.log(
    `  ✓ ${playoffs.series.length} series, play-in: ${!!playoffs.playIn}\n`,
  );

  // 3. Leaders — top 30 scorers with per-season values.
  console.log(`[3/4] Leaders (ESPN season year ${seasonToESPNYear(season)})...`);
  let leaders: Awaited<ReturnType<typeof getTopPlayersByAllStats>> = [];
  try {
    leaders = await getTopPlayersByAllStats(30, season);
  } catch (err) {
    console.warn('  ! Leaders fetch failed:', (err as Error).message);
  }
  await fs.writeFile(
    path.join(outDir, 'leaders.json'),
    JSON.stringify(leaders, null, 2),
  );
  console.log(`  ✓ ${leaders.length} leaders written\n`);

  // 4. Meta — champion / runner-up / finals score from playoffs, MVP from flag
  // or preserved from a prior meta.json.
  console.log('[4/4] Meta...');
  const prevMeta = await readExistingMeta(outDir);
  const { finals, winner, loser, score } = findChampionAndRunnerUp(playoffs);

  const meta: SeasonMeta = {
    season,
    champion: winner ? teamMeta(winner.tricode, standings) : undefined,
    runnerUp: loser ? teamMeta(loser.tricode, standings) : undefined,
    finalsMVP: mvp ?? prevMeta?.finalsMVP,
    finalsScore: score,
    frozen: true,
    frozenAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(outDir, 'meta.json'),
    JSON.stringify(meta, null, 2),
  );

  if (meta.champion) {
    console.log(
      `  ✓ Champion: ${meta.champion.city} ${meta.champion.name} (${score ?? '?'})`,
    );
  } else if (finals) {
    console.log(`  ! Finals series found but no winner detected (still ongoing?)`);
  } else {
    console.log('  ! No completed NBA Finals series in playoffs.json');
  }
  if (meta.finalsMVP) console.log(`  ✓ Finals MVP: ${meta.finalsMVP}`);

  console.log(`\nDone.\n`);
}

main().catch((err) => {
  console.error('\nfreeze-season failed:', err);
  process.exit(1);
});
