// ESPN API Client - Fallback for NBA data
// ESPN has a free, unofficial API that works without authentication

import { Scoreboard, Standings, Game, Standing } from './types';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

/**
 * Fetch scoreboard from ESPN for a specific date
 * @param date - Date string in YYYY-MM-DD format (REQUIRED for correct timezone handling)
 */
export async function getESPNScoreboard(date?: string): Promise<Scoreboard | null> {
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

    const url = `${ESPN_BASE_URL}/scoreboard?dates=${dateString}`;
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
export async function getESPNStandingsBySeason(seasonEndDate?: string): Promise<Standings | null> {
  try {
    // Fetch standings from the last few days to ensure we get all 30 teams
    const teamMap = new Map<number, Standing>();
    const baseDate = seasonEndDate ? new Date(seasonEndDate) : new Date();

    // Try fetching from base date and previous 7 days to gather all teams
    for (let daysAgo = 0; daysAgo <= 7 && teamMap.size < 30; daysAgo++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - daysAgo);
      const dateString = date.toISOString().split('T')[0].replace(/-/g, '');

      const url = `${ESPN_BASE_URL}/scoreboard?dates=${dateString}`;
      console.log(`Fetching standings from ESPN (${daysAgo} days ago):`, dateString);

      try {
        const response = await fetch(url, {
          next: { revalidate: 600 },
        });

        if (!response.ok) continue;

        const data = await response.json();

        // Extract team records from events
        data.events?.forEach((event: any) => {
          const competition = event.competitions[0];

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
            const isEastern = ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DET', 'IND', 'MIA', 'MIL', 'NY', 'NYK', 'ORL', 'PHI', 'TOR', 'WAS', 'WSH'].includes(team.abbreviation);

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
      } catch (error) {
        console.log('Error fetching date', dateString, ':', error);
        continue;
      }
    }

    console.log('Collected standings for', teamMap.size, 'teams');

    // Convert map to array
    const allStandings = Array.from(teamMap.values());

    // Sort by conference and win percentage
    const eastStandings = allStandings
      .filter(s => s.conference === 'East')
      .sort((a, b) => b.winPct - a.winPct);

    const westStandings = allStandings
      .filter(s => s.conference === 'West')
      .sort((a, b) => b.winPct - a.winPct);

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

    // Determine season based on date
    const seasonYear = seasonEndDate ? new Date(seasonEndDate).getFullYear() : new Date().getFullYear();
    const season = seasonEndDate ? `${seasonYear - 1}-${seasonYear.toString().slice(-2)}` : `${seasonYear}-${(seasonYear + 1).toString().slice(-2)}`;

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
    // Use ESPN's standings endpoint which has full details
    const url = `${ESPN_BASE_URL}/standings`;
    console.log('Fetching full standings from ESPN:', url);

    const response = await fetch(url, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      console.error('Failed to fetch ESPN standings:', response.status);
      return getESPNStandingsBySeason();
    }

    const data = await response.json();

    if (!data.children) {
      console.log('No standings children in ESPN response');
      return getESPNStandingsBySeason();
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

    const seasonYear = new Date().getFullYear();
    const season = `${seasonYear}-${(seasonYear + 1).toString().slice(-2)}`;

    return {
      season,
      seasonType: 'Regular Season',
      standings: allStandings,
    };
  } catch (error) {
    console.error('Error fetching ESPN full standings:', error);
    return getESPNStandingsBySeason();
  }
}
