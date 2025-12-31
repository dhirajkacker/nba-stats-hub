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
 * Always uses ESPN API to avoid timezone issues with NBA.com
 * @param date - Optional date string in YYYY-MM-DD format. Defaults to server's today.
 */
export async function getScoreboard(date?: string): Promise<Scoreboard | null> {
  const dateString = date || getTodayDateString();
  console.log('getScoreboard() called for date:', dateString);

  // Use ESPN API for all dates to ensure consistent handling
  return await getESPNScoreboard(dateString);
}

/**
 * Fetch today's NBA scoreboard (convenience wrapper)
 */
export async function getTodayScoreboard(): Promise<Scoreboard | null> {
  return getScoreboard();
}

/**
 * Fetch NBA scoreboard for API routes (without Next.js cache options)
 * Always uses ESPN API to ensure consistent date handling regardless of server timezone
 * @param date - Optional date string in YYYY-MM-DD format. Uses client's date if not provided.
 */
export async function getScoreboardForAPI(date?: string): Promise<Scoreboard | null> {
  // If no date provided, we can't determine client's date server-side
  // Client should always pass the date explicitly
  if (!date) {
    console.warn('getScoreboardForAPI called without date parameter - this should not happen');
    // Fallback to ESPN with undefined date (ESPN will use its own "today")
    return await getESPNScoreboard(undefined);
  }

  console.log('getScoreboardForAPI() called for date:', date);

  // Always use ESPN API for consistent date handling
  // This avoids timezone mismatches between server and client
  return await getESPNScoreboard(date);
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
