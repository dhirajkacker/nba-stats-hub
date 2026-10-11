// WNBA data router: live ESPN data for the live season, snapshot files in
// data/wnba/seasons/<season>/ for archived seasons. Mirrors lib/season-context.ts.

import { promises as fs } from 'fs';
import path from 'path';
import type { Standings } from '../types';
import type { SeasonMeta } from '../season-context';
import { isLiveSeason } from '../leagues';
import { fetchWnbaStandings } from './standings';
import { buildWnbaPlayoffs, wnbaFinalsResult, type WnbaPlayoffs } from './playoffs';
import { fetchWnbaLeaders, type WnbaLeadersResult } from './leaders';
import { wnbaSeasonFacts } from './seasons';

async function readSnapshot<T>(season: string, file: string): Promise<T | null> {
  try {
    const p = path.join(process.cwd(), 'data', 'wnba', 'seasons', season, file);
    return JSON.parse(await fs.readFile(p, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function live(season: string): boolean {
  return isLiveSeason('wnba', season);
}

export async function getWnbaSeasonStandings(season: string): Promise<Standings | null> {
  if (!live(season)) {
    const snap = await readSnapshot<Standings>(season, 'standings.json');
    if (snap) return snap;
  }
  return fetchWnbaStandings(season);
}

export async function getWnbaSeasonPlayoffs(season: string): Promise<WnbaPlayoffs | null> {
  if (!live(season)) {
    const snap = await readSnapshot<WnbaPlayoffs>(season, 'playoffs.json');
    if (snap) return snap;
  }
  const standings = await getWnbaSeasonStandings(season);
  if (!standings) return null;
  return buildWnbaPlayoffs(season, standings.standings);
}

export async function getWnbaSeasonLeaders(season: string, limit = 25): Promise<WnbaLeadersResult> {
  if (!live(season)) {
    const snap = await readSnapshot<WnbaLeadersResult['leaders']>(season, 'leaders.json');
    if (snap) return { leaders: snap.slice(0, limit), seasonUnavailable: false };
  }
  const standings = await getWnbaSeasonStandings(season);
  return fetchWnbaLeaders(season, standings?.standings ?? [], limit);
}

/**
 * Season meta. Archived seasons read meta.json. The live season reports a
 * champion as soon as its Finals are complete, before the season is frozen.
 */
export async function getWnbaSeasonMeta(season: string): Promise<SeasonMeta> {
  if (!live(season)) {
    const snap = await readSnapshot<SeasonMeta>(season, 'meta.json');
    if (snap) return snap;
  }
  const playoffs = await getWnbaSeasonPlayoffs(season);
  const result = playoffs ? wnbaFinalsResult(playoffs) : null;
  const meta: SeasonMeta = { season, frozen: false };
  if (result) {
    const ref = (t: typeof result.champion) => ({
      tricode: t.abbrev,
      city: t.name.slice(0, t.name.length - t.shortName.length).trim(),
      name: t.shortName,
      teamId: t.id,
      logo: t.logo,
    });
    meta.champion = ref(result.champion);
    meta.runnerUp = ref(result.runnerUp);
    meta.finalsScore = result.score;
    const mvp = wnbaSeasonFacts(season)?.finalsMVP;
    if (mvp) meta.finalsMVP = mvp;
  }
  return meta;
}
