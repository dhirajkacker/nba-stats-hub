// Look up a WNBA team as it was in a given season, by ESPN franchise id.

import type { Standing } from '../types';
import { getWnbaSeasonStandings } from './season-context';

/** The team's standings row for the season, or null if it didn't play that season. */
export async function getWnbaTeamForSeason(season: string, teamId: string): Promise<Standing | null> {
  const standings = await getWnbaSeasonStandings(season);
  return standings?.standings.find((t) => String(t.teamId) === teamId) ?? null;
}
