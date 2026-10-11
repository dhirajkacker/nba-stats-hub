// The team a WNBA player played for in a given season.
//
// ESPN's season-scoped athlete record and its leader entries both point at the
// player's latest team, not that season's (2010 Angel McCoughtry comes back as
// Minnesota; she played for Atlanta). The season game log is the reliable
// source: every game lists the player's team. We take the team from the
// player's last regular-season or playoff game, ignoring preseason and
// non-franchise teams (national-team exhibitions show up as "USA").
// Relative imports only (used by scripts/ as well as the app).

import type { PlayerTeam } from '../player-team';
import type { Standing } from '../types';
import { espnJson, WNBA } from './espn';
import { getWnbaTeamForSeason } from './teams';

/** ESPN team id of the player's last regular-season or playoff game that season. */
export async function wnbaSeasonTeamId(season: string, playerId: string, revalidate = 3600): Promise<string | null> {
  const log = await espnJson(`${WNBA.web}/athletes/${playerId}/gamelog?season=${season}`, revalidate);
  if (!log) return null;
  const eventIds = new Set<string>();
  for (const st of log.seasonTypes ?? []) {
    if (/preseason/i.test(st.displayName ?? '')) continue;
    for (const cat of st.categories ?? []) {
      for (const ev of cat.events ?? []) eventIds.add(String(ev.eventId));
    }
  }
  const games = Object.entries(log.events ?? {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([id, ev]: [string, any]) => eventIds.has(id) && ev.team?.id && !ev.team?.isAllStar)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([, ev]: [string, any]) => ev)
    .sort((a, b) => String(b.gameDate).localeCompare(String(a.gameDate)));
  return games[0]?.team?.id ? String(games[0].team.id) : null;
}

/** Season team as a link target, using the season's standings row for name and logo. */
export async function wnbaPlayerSeasonTeam(season: string, playerId: string): Promise<PlayerTeam | null> {
  const teamId = await wnbaSeasonTeamId(season, playerId);
  if (!teamId) return null;
  const row = await getWnbaTeamForSeason(season, teamId);
  if (!row) return null;
  return { abbrev: row.teamTricode, id: String(row.teamId), logo: row.logo ?? null, linkable: true };
}

/** Same lookup against standings already in hand (used by the leaders builder). */
export async function wnbaSeasonTeamRow(season: string, playerId: string, standings: Standing[]): Promise<Standing | null> {
  const teamId = await wnbaSeasonTeamId(season, playerId);
  return standings.find((t) => String(t.teamId) === teamId) ?? null;
}
