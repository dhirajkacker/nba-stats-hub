// Which team to show (and link) on a player's page for a given season.

import { getTeamLogoUrl } from './team-logos';
import type { LeagueId } from './leagues';
import { wnbaPlayerSeasonTeam } from './wnba/player-team';

export interface PlayerTeam {
  abbrev: string;
  /** ESPN team id. Required to link a WNBA team. */
  id?: string;
  logo: string | null;
  /** False when the team can't be linked for this season (shown as text only). */
  linkable: boolean;
}

export async function playerTeamForSeason(
  league: LeagueId,
  season: string,
  playerId: string,
  player: any,
): Promise<PlayerTeam | null> {
  if (league === 'nba') {
    // NBA keeps its original behaviour: the player's current team.
    const abbrev = player?.team?.abbreviation;
    if (!abbrev) return null;
    return { abbrev, logo: getTeamLogoUrl(abbrev, 'small'), linkable: true };
  }
  // WNBA: the team the player was on that season, linked only when that team
  // exists in the season's standings.
  return wnbaPlayerSeasonTeam(season, playerId);
}
