// Season-aware data router.
//
// For the current season, calls live ESPN/NBA functions.
// For past seasons, reads snapshot JSON from data/seasons/<season>/.
// Components downstream receive the same shapes either way.

import { promises as fs } from 'fs';
import path from 'path';
import { CURRENT_SEASON, seasonRegularSeasonEndDate, seasonPostseasonAnchorDate } from './seasons';
import { getESPNStandings, getESPNStandingsBySeason } from './espn-api';
import { getPlayoffsData as livePlayoffs, type PlayoffsData } from './playoffs-api';
import { getTopPlayersByAllStats, type ESPNStatsLeader } from './espn-stats-leaders';
import type { Standings } from './types';

export interface SeasonMeta {
  season: string;
  champion?: { tricode: string; city: string; name: string };
  runnerUp?: { tricode: string; city: string; name: string };
  finalsMVP?: string;
  finalsScore?: string;
  frozen: boolean;
  frozenAt?: string;
}

async function readSnapshot<T>(season: string, file: string): Promise<T | null> {
  try {
    const p = path.join(process.cwd(), 'data', 'seasons', season, file);
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getSeasonStandings(season: string): Promise<Standings | null> {
  if (season === CURRENT_SEASON) {
    return getESPNStandings();
  }
  const snap = await readSnapshot<Standings>(season, 'standings.json');
  if (snap) return snap;
  // Snapshot missing: best-effort fallback — walk the regular-season end window.
  return getESPNStandingsBySeason(seasonRegularSeasonEndDate(season));
}

export async function getSeasonPlayoffs(season: string): Promise<PlayoffsData> {
  if (season === CURRENT_SEASON) {
    return livePlayoffs();
  }
  const snap = await readSnapshot<PlayoffsData>(season, 'playoffs.json');
  if (snap) return snap;
  // Snapshot missing: try to assemble from ESPN events anchored at the season's
  // postseason window. Requires the anchorDate option on getPlayoffsData.
  return livePlayoffs({ anchorDate: seasonPostseasonAnchorDate(season) });
}

export async function getSeasonLeaders(season: string, limit = 30): Promise<ESPNStatsLeader[]> {
  if (season === CURRENT_SEASON) {
    return getTopPlayersByAllStats(limit);
  }
  const snap = await readSnapshot<ESPNStatsLeader[]>(season, 'leaders.json');
  return snap ?? [];
}

export async function getSeasonMeta(season: string): Promise<SeasonMeta> {
  if (season === CURRENT_SEASON) {
    return { season, frozen: false };
  }
  const snap = await readSnapshot<SeasonMeta>(season, 'meta.json');
  return snap ?? { season, frozen: true };
}
