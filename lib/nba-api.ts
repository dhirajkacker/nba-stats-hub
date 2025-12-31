// NBA API Client Wrapper

import { Scoreboard, Standings, TeamStats, PlayerStats, GameLog } from './types';
import { getESPNScoreboard, getESPNStandings } from './espn-api';

const NBA_BASE_URL = 'https://cdn.nba.com';
const NBA_STATS_URL = 'https://stats.nba.com/stats';

// Common headers to mimic browser requests
const commonHeaders = {
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
};

// Helper to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get current season (e.g., "2024-25")
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed

  // NBA season typically starts in October (month 10)
  // If current month is before October, we're in the previous season
  if (month < 10) {
    return `${year - 1}-${String(year).slice(2)}`;
  }
  return `${year}-${String(year + 1).slice(2)}`;
}

/**
 * Fetch NBA scoreboard for a specific date with live scores
 * Revalidates every 30 seconds for real-time updates
 * @param date - Optional date string in YYYY-MM-DD format. Defaults to today.
 */
export async function getScoreboard(date?: string): Promise<Scoreboard | null> {
  const dateString = date || getTodayDateString();
  const todayString = getTodayDateString();

  console.log('getScoreboard() called for date:', dateString);

  // If requesting a date other than today, use ESPN API directly
  // because NBA.com's todaysScoreboard_00.json only has today's games
  if (dateString !== todayString) {
    console.log('Fetching non-today date, using ESPN API for:', dateString);
    return await getESPNScoreboard(dateString);
  }

  // For today's games, try NBA.com first, then fall back to ESPN
  try {
    const url = `${NBA_BASE_URL}/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
    console.log('Attempting to fetch from NBA.com:', url);

    const response = await fetch(url, {
      cache: 'no-store', // Disable caching for real-time data
      headers: commonHeaders,
    });

    console.log('NBA.com scoreboard response status:', response.status);

    if (!response.ok) {
      console.log('NBA.com scoreboard API failed, falling back to ESPN API');
      return await getESPNScoreboard(dateString);
    }

    const data = await response.json();

    console.log('NBA.com data structure:', Object.keys(data));
    console.log('NBA.com scoreboard games count:', data.scoreboard?.games?.length);

    if (data.scoreboard?.games && data.scoreboard.games.length > 0) {
      console.log('Sample NBA.com game:', JSON.stringify(data.scoreboard.games[0]).substring(0, 500));
    }

    // Transform NBA.com format to match our types
    const games = (data.scoreboard?.games || []).map((game: any) => ({
      ...game,
      // NBA.com returns gameStatus as a number, but our types expect an object
      // Preserve both nested and top-level properties for compatibility
      period: game.period,
      gameClock: game.gameClock || '',
      gameStatus: {
        status: game.gameStatus,
        statusText: game.gameStatusText || '',
        period: game.period || 0,
        gameClock: game.gameClock || '',
        displayClock: game.gameClock || '',
      }
    }));

    console.log('Transformed games count:', games.length);

    return {
      gameDate: data.scoreboard?.gameDate || dateString,
      games,
    };
  } catch (error) {
    console.error('Error fetching NBA.com scoreboard, trying ESPN:', error);
    return await getESPNScoreboard(dateString);
  }
}

/**
 * Fetch today's NBA scoreboard (convenience wrapper)
 */
export async function getTodayScoreboard(): Promise<Scoreboard | null> {
  return getScoreboard();
}

/**
 * Fetch NBA scoreboard for API routes (without Next.js cache options)
 * @param date - Optional date string in YYYY-MM-DD format. Defaults to today.
 */
export async function getScoreboardForAPI(date?: string): Promise<Scoreboard | null> {
  const dateString = date || getTodayDateString();
  const todayString = getTodayDateString();

  console.log('getScoreboardForAPI() called for date:', dateString);

  // If requesting a date other than today, use ESPN API directly
  if (dateString !== todayString) {
    console.log('Fetching non-today date, using ESPN API for:', dateString);
    return await getESPNScoreboard(dateString);
  }

  // For today's games, try NBA.com first, then fall back to ESPN
  try {
    const url = `${NBA_BASE_URL}/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
    console.log('Attempting to fetch from NBA.com (API route):', url);

    const response = await fetch(url, {
      headers: commonHeaders,
    });

    console.log('NBA.com scoreboard response status:', response.status);

    if (!response.ok) {
      console.log('NBA.com scoreboard API failed, falling back to ESPN API');
      return await getESPNScoreboard(dateString);
    }

    const data = await response.json();

    // Transform NBA.com format to match our types
    const games = (data.scoreboard?.games || []).map((game: any) => ({
      ...game,
      // Preserve both nested and top-level properties for compatibility
      period: game.period,
      gameClock: game.gameClock || '',
      gameStatus: {
        status: game.gameStatus,
        statusText: game.gameStatusText || '',
        period: game.period || 0,
        gameClock: game.gameClock || '',
        displayClock: game.gameClock || '',
      }
    }));

    console.log('Transformed games count:', games.length);

    return {
      gameDate: data.scoreboard?.gameDate || dateString,
      games,
    };
  } catch (error) {
    console.error('Error fetching NBA.com scoreboard, trying ESPN:', error);
    return await getESPNScoreboard(dateString);
  }
}

/**
 * Fetch NBA standings
 * Revalidates every 10 minutes
 */
export async function getStandings(): Promise<Standings | null> {
  try {
    const dateString = getTodayDateString();
    const url = `${NBA_BASE_URL}/static/json/staticData/standings/${dateString}/standings.json`;

    console.log('Fetching standings from:', url);

    const response = await fetch(url, {
      cache: 'no-store', // Disable caching for fresh data
      headers: commonHeaders,
    });

    if (!response.ok) {
      console.log('NBA.com standings failed, falling back to ESPN API');
      return await getESPNStandings();
    }

    const data = await response.json();

    return {
      season: data.season || getCurrentSeason(),
      seasonType: data.seasonType || 'Regular Season',
      standings: data.standings || [],
    };
  } catch (error) {
    console.error('Error fetching NBA.com standings, trying ESPN:', error);
    return await getESPNStandings();
  }
}

/**
 * Fetch team statistics
 * Revalidates every hour
 */
export async function getTeamStats(teamId: number, season?: string): Promise<TeamStats | null> {
  try {
    const seasonParam = season || getCurrentSeason();
    const url = `${NBA_STATS_URL}/teamdashboardbygeneralsplits`;

    const params = new URLSearchParams({
      TeamID: teamId.toString(),
      Season: seasonParam,
      SeasonType: 'Regular Season',
      MeasureType: 'Base',
      PerMode: 'PerGame',
      PlusMinus: 'N',
      PaceAdjust: 'N',
      Rank: 'N',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      GameSegment: '',
      Period: '0',
      LastNGames: '0',
    });

    const response = await fetch(`${url}?${params}`, {
      next: { revalidate: 1800 }, // Revalidate every 30 minutes
      headers: commonHeaders,
    });

    if (!response.ok) {
      console.error('Failed to fetch team stats:', response.statusText);
      return null;
    }

    const data = await response.json();

    // Parse the response (NBA Stats API returns data in a specific format)
    if (data.resultSets && data.resultSets.length > 0) {
      const headers = data.resultSets[0].headers;
      const row = data.resultSets[0].rowSet[0];

      // Map the data to our TeamStats interface
      // This is a simplified version - you'll need to adjust based on actual API response
      const stats: any = {};
      headers.forEach((header: string, index: number) => {
        stats[header] = row[index];
      });

      return stats as TeamStats;
    }

    return null;
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return null;
  }
}

/**
 * Fetch team game logs (recent games)
 * Revalidates every hour
 */
export async function getTeamGameLogs(
  teamId: number,
  season?: string,
  lastNGames?: number
): Promise<GameLog[] | null> {
  try {
    const seasonParam = season || getCurrentSeason();
    const url = `${NBA_STATS_URL}/teamgamelogs`;

    const params = new URLSearchParams({
      TeamID: teamId.toString(),
      Season: seasonParam,
      SeasonType: 'Regular Season',
      LastNGames: lastNGames ? lastNGames.toString() : '0',
    });

    const response = await fetch(`${url}?${params}`, {
      next: { revalidate: 600 }, // Revalidate every 10 minutes (game logs change frequently)
      headers: commonHeaders,
    });

    if (!response.ok) {
      console.error('Failed to fetch team game logs:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.resultSets && data.resultSets.length > 0) {
      const headers = data.resultSets[0].headers;
      const rows = data.resultSets[0].rowSet;

      return rows.map((row: any[]) => {
        const game: any = {};
        headers.forEach((header: string, index: number) => {
          game[header] = row[index];
        });
        return game as GameLog;
      });
    }

    return null;
  } catch (error) {
    console.error('Error fetching team game logs:', error);
    return null;
  }
}

/**
 * Fetch player statistics
 * Revalidates every hour
 */
export async function getPlayerStats(
  playerId: number,
  season?: string
): Promise<PlayerStats | null> {
  try {
    const seasonParam = season || getCurrentSeason();
    const url = `${NBA_STATS_URL}/playerdashboardbygeneralsplits`;

    const params = new URLSearchParams({
      PlayerID: playerId.toString(),
      Season: seasonParam,
      SeasonType: 'Regular Season',
      MeasureType: 'Base',
      PerMode: 'PerGame',
      PlusMinus: 'N',
      PaceAdjust: 'N',
      Rank: 'N',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      GameSegment: '',
      Period: '0',
      LastNGames: '0',
    });

    const response = await fetch(`${url}?${params}`, {
      next: { revalidate: 1800 }, // Revalidate every 30 minutes
      headers: commonHeaders,
    });

    if (!response.ok) {
      console.error('Failed to fetch player stats:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.resultSets && data.resultSets.length > 0) {
      const headers = data.resultSets[0].headers;
      const row = data.resultSets[0].rowSet[0];

      const stats: any = {};
      headers.forEach((header: string, index: number) => {
        stats[header] = row[index];
      });

      return stats as PlayerStats;
    }

    return null;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

/**
 * Fetch player game logs (recent games)
 * Revalidates every hour
 */
export async function getPlayerGameLogs(
  playerId: number,
  season?: string,
  lastNGames?: number
): Promise<GameLog[] | null> {
  try {
    const seasonParam = season || getCurrentSeason();
    const url = `${NBA_STATS_URL}/playergamelogs`;

    const params = new URLSearchParams({
      PlayerID: playerId.toString(),
      Season: seasonParam,
      SeasonType: 'Regular Season',
      LastNGames: lastNGames ? lastNGames.toString() : '0',
    });

    const response = await fetch(`${url}?${params}`, {
      next: { revalidate: 600 }, // Revalidate every 10 minutes (game logs change frequently)
      headers: commonHeaders,
    });

    if (!response.ok) {
      console.error('Failed to fetch player game logs:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.resultSets && data.resultSets.length > 0) {
      const headers = data.resultSets[0].headers;
      const rows = data.resultSets[0].rowSet;

      return rows.map((row: any[]) => {
        const game: any = {};
        headers.forEach((header: string, index: number) => {
          game[header] = row[index];
        });
        return game as GameLog;
      });
    }

    return null;
  } catch (error) {
    console.error('Error fetching player game logs:', error);
    return null;
  }
}
