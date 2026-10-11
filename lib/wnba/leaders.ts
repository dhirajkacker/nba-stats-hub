// WNBA scoring leaders for one season, entirely from that season's ESPN data:
// the leader list, the season's athlete record (name, jersey, position,
// headshot) and the season's per-game averages. The team comes from the
// player's season game log, because ESPN's leader and season-athlete team
// refs point at the player's latest team.
// Relative imports only (used by scripts/ as well as the app).

import type { ESPNStatsLeader } from '../espn-stats-leaders';
import type { Standing } from '../types';
import { espnJson, httpsRef, WNBA } from './espn';
import { wnbaSeasonTeamRow } from './player-team';

export interface WnbaLeader extends Omit<ESPNStatsLeader, 'team'> {
  team: { abbreviation: string; id: string; logo: string | null };
  headshot: string | null;
}

export interface WnbaLeadersResult {
  leaders: WnbaLeader[];
  /** ESPN has no leaders for the season yet (e.g. before opening night). */
  seasonUnavailable: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

function idFromRef(ref: string | undefined, kind: 'athletes' | 'teams'): string | null {
  return ref?.match(new RegExp(`/${kind}/(\\d+)`))?.[1] ?? null;
}

function statMap(statsDoc: Json): Map<string, number> {
  const out = new Map<string, number>();
  for (const cat of statsDoc?.splits?.categories ?? []) {
    for (const s of cat.stats ?? []) {
      if (!out.has(s.name) && Number.isFinite(Number(s.value))) out.set(s.name, Number(s.value));
    }
  }
  return out;
}

export async function fetchWnbaLeaders(
  season: string,
  standings: Standing[],
  limit = 25,
  revalidate = 3600,
): Promise<WnbaLeadersResult> {
  const year = parseInt(season, 10);
  const doc = await espnJson(`${WNBA.core}/seasons/${year}/types/2/leaders?lang=en&region=us&limit=${limit + 5}`, revalidate);
  const category = doc?.categories?.find((c: Json) => c.name === 'pointsPerGame');
  if (!category?.leaders?.length) return { leaders: [], seasonUnavailable: !doc };

  const top: Json[] = category.leaders.slice(0, limit);

  const leaders = await Promise.all(
    top.map(async (entry: Json): Promise<WnbaLeader | null> => {
      const athleteId = idFromRef(entry.athlete?.$ref, 'athletes');
      if (!athleteId) return null;
      const [athlete, statsDoc] = await Promise.all([
        espnJson(httpsRef(entry.athlete.$ref), revalidate),
        espnJson(`${WNBA.core}/seasons/${year}/types/2/athletes/${athleteId}/statistics`, revalidate),
      ]);
      if (!athlete) return null;

      // The leader entry's team ref is the player's latest team, not that
      // season's, so take the team from the season game log instead.
      const row = await wnbaSeasonTeamRow(season, athleteId, standings);
      const teamId = row ? String(row.teamId) : '';
      const abbreviation = row?.teamTricode ?? '';
      const logo = row?.logo ?? null;

      const stats = statMap(statsDoc);
      const ppg = stats.get('avgPoints') ?? Number(entry.value) ?? 0;
      return {
        id: athleteId,
        displayName: athlete.displayName ?? athlete.fullName ?? '',
        team: { abbreviation, id: teamId, logo },
        position: athlete.position?.abbreviation ? { abbreviation: athlete.position.abbreviation } : undefined,
        jersey: athlete.jersey,
        headshot: athlete.headshot?.href ?? null,
        stats: {
          gamesPlayed: stats.get('gamesPlayed') ?? 0,
          ppg,
          rpg: stats.get('avgRebounds') ?? 0,
          apg: stats.get('avgAssists') ?? 0,
          fgPct: stats.get('fieldGoalPct') ?? 0,
          fg3Pct: stats.get('threePointFieldGoalPct') ?? stats.get('threePointPct') ?? 0,
          ftPct: stats.get('freeThrowPct') ?? 0,
          mpg: stats.get('avgMinutes') ?? 0,
        },
      };
    }),
  );

  const list = leaders.filter((l): l is WnbaLeader => !!l).sort((a, b) => b.stats.ppg - a.stats.ppg);
  return { leaders: list, seasonUnavailable: false };
}
