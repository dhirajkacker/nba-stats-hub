// ESPN API Client - Fallback for NBA data
// ESPN has a free, unofficial API that works without authentication

import { Scoreboard, Standings, Game, Standing } from './types';
import { CURRENT_SEASON, seasonToESPNYear } from './seasons';
import { espnUrls, type LeagueId } from './leagues';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

/**
 * Determine NBA season string based on a date
 * NBA season spans two calendar years: starts in October, ends in June
 * e.g., October 2025 - June 2026 = "2025-26" season
 */
function getNBASeasonFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // If October-December, season is currentYear to currentYear+1
  // If January-September, season is previousYear to currentYear
  if (month >= 10) {
    // October-December: new season has started
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    // January-September: still in previous year's season
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Fetch scoreboard from ESPN for a specific date
 * @param date - Date string in YYYY-MM-DD format (REQUIRED for correct timezone handling)
 */
export async function getESPNScoreboard(league: LeagueId, date?: string): Promise<Scoreboard | null> {
  try {
    // Format date as YYYYMMDD for ESPN API
    // Use the date string directly to avoid timezone conversion issues
    let dateString: string;
    if (date) {
      // Remove hyphens from YYYY-MM-DD to get YYYYMMDD
      dateString = date.replace(/-/g, '');
    } else {
      // Fallback only - client should always provide date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      dateString = `${year}${month}${day}`;
      console.warn('ESPN API called without date - using server date:', dateString);
    }

    const url = `${espnUrls(league).site}/scoreboard?dates=${dateString}`;
    console.log('Fetching from ESPN scoreboard:', url, 'for input date:', date, 'formatted:', dateString);

    const response = await fetch(url, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error('Failed to fetch ESPN scoreboard:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('ESPN scoreboard data received, games:', data.events?.length || 0);
    console.log('ESPN scoreboard game date:', data.day?.date);
    console.log('ESPN scoreboard season:', data.season);

    if (!data.events || data.events.length === 0) {
      console.log('No events in ESPN scoreboard response');
      console.log('Response keys:', Object.keys(data));
      console.log('Full response:', JSON.stringify(data, null, 2));
      return {
        gameDate: data.day?.date || new Date().toISOString().split('T')[0],
        games: [],
      };
    }

    console.log('Sample game event:', JSON.stringify(data.events[0], null, 2).substring(0, 500));

    // Transform ESPN format to our format
    const games: Game[] = (data.events || []).map((event: any) => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

      // Extract wins/losses from records
      const getRecord = (competitor: any) => {
        const recordStr = competitor.records?.[0]?.summary || '0-0';
        const recordParts = recordStr.split('-');
        return {
          wins: parseInt(recordParts[0]) || 0,
          losses: parseInt(recordParts[1]) || 0,
        };
      };

      const homeRecord = getRecord(homeTeam);
      const awayRecord = getRecord(awayTeam);

      // Map ESPN status to our status codes (1=scheduled, 2=live, 3=finished)
      let gameStatus = 1;
      if (competition.status.type.completed) {
        gameStatus = 3;
      } else if (competition.status.type.state === 'in') {
        gameStatus = 2;
      }

      return {
        gameId: event.id,
        gameCode: `${awayTeam.team.abbreviation}${homeTeam.team.abbreviation}`,
        gameStatus: {
          status: gameStatus,
          statusText: competition.status.type.detail,
          period: parseInt(competition.status.period) || 0,
          gameClock: competition.status.displayClock || '',
          displayClock: competition.status.displayClock || '',
        },
        gameStatusText: competition.status.type.detail,
        gameTimeUTC: event.date,
        gameEt: event.date,
        homeTeam: {
          teamId: parseInt(homeTeam.team.id),
          teamName: homeTeam.team.name,
          teamTricode: homeTeam.team.abbreviation,
          teamLogo: homeTeam.team.logo,
          teamCity: homeTeam.team.location || '',
          score: parseInt(homeTeam.score) || 0,
          inBonus: false,
          timeoutsRemaining: 0,
          wins: homeRecord.wins,
          losses: homeRecord.losses,
        },
        awayTeam: {
          teamId: parseInt(awayTeam.team.id),
          teamName: awayTeam.team.name,
          teamTricode: awayTeam.team.abbreviation,
          teamLogo: awayTeam.team.logo,
          teamCity: awayTeam.team.location || '',
          score: parseInt(awayTeam.score) || 0,
          inBonus: false,
          timeoutsRemaining: 0,
          wins: awayRecord.wins,
          losses: awayRecord.losses,
        },
        period: parseInt(competition.status.period) || 0,
        gameClock: competition.status.displayClock || '',
        regulationPeriods: 4,
        seasonType: event.season?.type,
      };
    });

    return {
      gameDate: data.day?.date || new Date().toISOString().split('T')[0],
      games,
    };
  } catch (error) {
    console.error('Error fetching ESPN scoreboard:', error);
    return null;
  }
}

/**
 * Fetch NBA standings from ESPN scoreboard for a specific season
 */
// "2027" -> "2026-27"
function espnYearToSeason(year: number): string {
  return `${year - 1}-${String(year).slice(-2)}`;
}

const EASTERN_ABBREVS = ['ATL', 'BOS', 'BKN', 'NJ', 'CHA', 'CHI', 'CLE', 'DET', 'IND', 'MIA', 'MIL', 'NY', 'NYK', 'ORL', 'PHI', 'TOR', 'WAS', 'WSH'];

function emptyStanding(team: any): Standing {
  return {
    teamId: parseInt(team.id),
    teamCity: team.location || '',
    teamName: team.name || '',
    teamTricode: team.abbreviation || '',
    conference: EASTERN_ABBREVS.includes(team.abbreviation) ? 'East' : 'West',
    confRank: 0,
    wins: 0,
    losses: 0,
    winPct: 0,
    gamesBehind: 0,
    homeWins: 0,
    homeLosses: 0,
    awayWins: 0,
    awayLosses: 0,
    confWins: 0,
    confLosses: 0,
    lastTenWins: 0,
    lastTenLosses: 0,
    streak: '-',
  };
}

/**
 * Build standings by walking the scoreboard backwards from seasonEndDate (or
 * today) and taking each team's record from its most recent regular-season game.
 *
 * Pass espnSeasonYear (the season's end year, e.g. 2027 for 2026-27) to count
 * only that season's games. Without it, an early-season walk would pick up the
 * previous season's final records. With it, the walk stops at October 1 of the
 * season's start year, and any team that hasn't played yet is listed at 0-0.
 */
export async function getESPNStandingsBySeason(seasonEndDate?: string, espnSeasonYear?: number): Promise<Standings | null> {
  try {
    // Fetch scoreboard data in parallel batches walking backwards from baseDate
    // until we've collected all 30 teams' regular-season records. Filtering
    // strictly to season.type === 2 (regular season) means the snapshot is
    // naturally frozen once the play-in / playoffs start — postseason wins
    // and losses don't leak into the table.
    const teamMap = new Map<number, Standing>();
    const baseDate = seasonEndDate ? new Date(seasonEndDate) : new Date();
    // 200 days handles weird seasons (e.g., 2019-20 bubble: 8 non-bubble teams
    // stopped playing March 11, 2020 — five months before the bubble ended).
    // The loop exits early once all 30 teams are found, so normal seasons pay
    // no penalty.
    let MAX_DAYS_BACK = 200;
    const BATCH_SIZE = 7;
    if (espnSeasonYear) {
      const seasonStart = new Date(Date.UTC(espnSeasonYear - 1, 9, 1)); // Oct 1
      const daysSinceStart = Math.ceil((baseDate.getTime() - seasonStart.getTime()) / 86_400_000);
      MAX_DAYS_BACK = Math.max(0, Math.min(MAX_DAYS_BACK, daysSinceStart + 1));
    }

    for (let batchStart = 0; batchStart < MAX_DAYS_BACK && teamMap.size < 30; batchStart += BATCH_SIZE) {
      const batchPromises: Promise<any>[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const daysAgo = batchStart + i;
        const date = new Date(baseDate);
        date.setDate(date.getDate() - daysAgo);
        const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
        const url = `${ESPN_BASE_URL}/scoreboard?dates=${dateString}`;
        batchPromises.push(
          fetch(url, { next: { revalidate: 600 } })
            .then(r => (r.ok ? r.json() : null))
            .catch(() => null)
        );
      }
      const batch = await Promise.all(batchPromises);

      for (const data of batch) {
        if (!data) continue;
        data.events?.forEach((event: any) => {
          // Only count regular-season games (type 2). This freezes the
          // standings to the last regular-season record once postseason begins.
          if (event.season?.type !== 2) return;
          if (espnSeasonYear && event.season?.year !== espnSeasonYear) return;
          const competition = event.competitions[0];
          // ESPN tags All-Star games and the in-season Cup final as regular-season
          // games. All-Star "teams" (STARS, WORLD, ...) aren't franchises and the
          // Cup final doesn't count in the standings, so skip both.
          const competitionType = competition?.type?.abbreviation;
          if (competitionType === 'ALLSTAR' || competitionType === 'CC') return;

          competition.competitors?.forEach((competitor: any) => {
            const team = competitor.team;
            const teamId = parseInt(team.id);

            // Skip if we already have this team
            if (teamMap.has(teamId)) return;

            // Get record from competitor (format: "23-5" or similar)
            const recordStr = competitor.records?.[0]?.summary || '0-0';
            const recordParts = recordStr.split('-');
            const wins = parseInt(recordParts[0]) || 0;
            const losses = parseInt(recordParts[1]) || 0;
            const winPct = wins + losses > 0 ? wins / (wins + losses) : 0;

            // Parse detailed records from competitor.records array
            let homeWins = 0, homeLosses = 0, awayWins = 0, awayLosses = 0;
            let confWins = 0, confLosses = 0, lastTenWins = 0, lastTenLosses = 0;
            let streak = '-';

            competitor.records?.forEach((record: any) => {
              const summary = record.summary || '0-0';
              const parts = summary.split('-');
              const w = parseInt(parts[0]) || 0;
              const l = parseInt(parts[1]) || 0;

              if (record.type === 'home') {
                homeWins = w;
                homeLosses = l;
              } else if (record.type === 'road' || record.type === 'away') {
                awayWins = w;
                awayLosses = l;
              } else if (record.type === 'vsconf') {
                confWins = w;
                confLosses = l;
              } else if (record.type === 'last10') {
                lastTenWins = w;
                lastTenLosses = l;
              }
            });

            // Get streak from competitor
            if (competitor.curatedRank?.current) {
              streak = competitor.curatedRank.current.toString();
            }
            // Try to parse streak from record stats
            const streakRecord = competitor.records?.find((r: any) => r.name === 'streak' || r.type === 'streak');
            if (streakRecord?.summary) {
              streak = streakRecord.summary;
            }

            // Determine conference
            // Note: ESPN uses different abbreviations: WSH (not WAS), NY (not NYK), GS (not GSW), NO (not NOP), SA (not SAS)
            const isEastern = EASTERN_ABBREVS.includes(team.abbreviation);

            const standing: Standing = {
              teamId,
              teamCity: team.location || '',
              teamName: team.name || '',
              teamTricode: team.abbreviation || '',
              conference: isEastern ? 'East' : 'West',
              confRank: 0,
              wins,
              losses,
              winPct,
              gamesBehind: 0,
              homeWins,
              homeLosses,
              awayWins,
              awayLosses,
              confWins,
              confLosses,
              lastTenWins,
              lastTenLosses,
              streak,
            };

            teamMap.set(teamId, standing);
          });
        });
      }
    }

    console.log('Collected standings for', teamMap.size, 'teams');

    // Early in a season some (or all) teams haven't played a regular-season
    // game yet. List them at 0-0 so the table always has all 30 teams.
    if (espnSeasonYear && teamMap.size < 30) {
      try {
        const res = await fetch(`${ESPN_BASE_URL}/teams`, { next: { revalidate: 86400 } });
        if (res.ok) {
          const data = await res.json();
          for (const t of data.sports?.[0]?.leagues?.[0]?.teams ?? []) {
            const id = parseInt(t.team?.id);
            if (!teamMap.has(id)) teamMap.set(id, emptyStanding(t.team));
          }
        }
      } catch (err) {
        console.error('Failed to fetch ESPN teams list for 0-0 fill:', err);
      }
    }

    // Convert map to array
    const allStandings = Array.from(teamMap.values());

    // Sort by conference and win percentage
    const eastStandings = allStandings
      .filter(s => s.conference === 'East')
      .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || a.teamCity.localeCompare(b.teamCity));

    const westStandings = allStandings
      .filter(s => s.conference === 'West')
      .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || a.teamCity.localeCompare(b.teamCity));

    // Calculate ranks and games behind
    eastStandings.forEach((team, index) => {
      team.confRank = index + 1;
      if (index > 0) {
        const leader = eastStandings[0];
        team.gamesBehind = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
      }
    });

    westStandings.forEach((team, index) => {
      team.confRank = index + 1;
      if (index > 0) {
        const leader = westStandings[0];
        team.gamesBehind = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
      }
    });

    const finalStandings = [...eastStandings, ...westStandings];
    console.log('Processed standings for', finalStandings.length, 'teams (East:', eastStandings.length, 'West:', westStandings.length, ')');

    const season = espnSeasonYear
      ? espnYearToSeason(espnSeasonYear)
      : getNBASeasonFromDate(seasonEndDate ? new Date(seasonEndDate) : new Date());

    return {
      season,
      seasonType: 'Regular Season',
      standings: finalStandings,
    };
  } catch (error) {
    console.error('Error fetching ESPN standings:', error);
    return null;
  }
}

/**
 * Fetch current NBA standings with full details
 */
export async function getESPNStandings(): Promise<Standings | null> {
  try {
    // ESPN's site standings endpoint stopped returning entries; rely on the
    // scoreboard-walk path which assembles a 30-team snapshot from the last
    // regular-season window.
    const url = `${ESPN_BASE_URL}/standings`;
    console.log('Fetching full standings from ESPN:', url);

    const response = await fetch(url, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      console.error('Failed to fetch ESPN standings:', response.status);
      return getESPNStandingsBySeason(undefined, seasonToESPNYear(CURRENT_SEASON));
    }

    const data = await response.json();

    if (!data.children || !data.children.some((c: any) => (c.standings?.entries?.length ?? 0) > 0)) {
      console.log('ESPN standings endpoint returned no entries; falling back to scoreboard walk');
      return getESPNStandingsBySeason(undefined, seasonToESPNYear(CURRENT_SEASON));
    }

    const allStandings: Standing[] = [];

    // ESPN returns standings grouped by conference
    data.children.forEach((conference: any) => {
      const isEast = conference.name === 'Eastern Conference';
      const confName: 'East' | 'West' = isEast ? 'East' : 'West';

      conference.standings?.entries?.forEach((entry: any, index: number) => {
        const team = entry.team;
        const stats = entry.stats;

        // Helper to get stat value by name
        const getStat = (name: string) => {
          const stat = stats.find((s: any) => s.name === name);
          return stat ? parseFloat(stat.value) : 0;
        };

        const wins = getStat('wins');
        const losses = getStat('losses');
        const winPct = getStat('winPercent');
        const gamesBehind = getStat('gamesBehind');

        // Parse home/away records (format: "15-5")
        const homeRecord = getStat('homeRecord') ? String(getStat('homeRecord')).split('-') : ['0', '0'];
        const awayRecord = getStat('awayRecord') ? String(getStat('awayRecord')).split('-') : ['0', '0'];

        // Parse last 10 record
        const last10 = getStat('vsConf') ? String(getStat('vsConf')).split('-') : ['0', '0'];

        // Get streak
        const streak = entry.stats.find((s: any) => s.name === 'streak')?.displayValue || '-';

        const standing: Standing = {
          teamId: parseInt(team.id),
          teamCity: team.location || '',
          teamName: team.name || '',
          teamTricode: team.abbreviation || '',
          conference: confName,
          confRank: index + 1,
          wins,
          losses,
          winPct,
          gamesBehind,
          homeWins: parseInt(homeRecord[0]) || 0,
          homeLosses: parseInt(homeRecord[1]) || 0,
          awayWins: parseInt(awayRecord[0]) || 0,
          awayLosses: parseInt(awayRecord[1]) || 0,
          confWins: parseInt(last10[0]) || 0,
          confLosses: parseInt(last10[1]) || 0,
          lastTenWins: parseInt(last10[0]) || 0,
          lastTenLosses: parseInt(last10[1]) || 0,
          streak,
        };

        allStandings.push(standing);
      });
    });

    console.log('Fetched full standings for', allStandings.length, 'teams with home/away splits');

    return {
      season: CURRENT_SEASON,
      seasonType: 'Regular Season',
      standings: allStandings,
    };
  } catch (error) {
    console.error('Error fetching ESPN full standings:', error);
    return getESPNStandingsBySeason(undefined, seasonToESPNYear(CURRENT_SEASON));
  }
}
