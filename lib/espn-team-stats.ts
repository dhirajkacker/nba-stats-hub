// Team data from ESPN: season stats, game log and current roster.
// Functions take the league and an ESPN team id. NBA callers turn a tricode
// into an id with nbaTeamId(); WNBA pages already have the franchise id.

import { espnUrls, type LeagueId } from './leagues';

// Normalize team tricode to handle variations (ESPN uses non-standard codes)
function normalizeTeamTricode(code: string): string {
  const normalized: { [key: string]: string } = {
    'GS': 'GSW',
    'NO': 'NOP',
    'SA': 'SAS',
    'NY': 'NYK',
    'UTAH': 'UTA',  // ESPN uses "UTAH" instead of "UTA"
    'WSH': 'WAS',   // Handle Washington variation
  };
  const upperCode = code.toUpperCase();
  return normalized[upperCode] || upperCode;
}

const TEAM_ID_MAP: { [key: string]: string } = {
  'ATL': '1', 'BOS': '2', 'BKN': '17', 'CHA': '30', 'CHI': '4',
  'CLE': '5', 'DAL': '6', 'DEN': '7', 'DET': '8', 'GSW': '9',
  'HOU': '10', 'IND': '11', 'LAC': '12', 'LAL': '13', 'MEM': '29',
  'MIA': '14', 'MIL': '15', 'MIN': '16', 'NOP': '3', 'NYK': '18',
  'OKC': '25', 'ORL': '19', 'PHI': '20', 'PHX': '21', 'POR': '22',
  'SAC': '23', 'SAS': '24', 'TOR': '28', 'UTA': '26', 'WAS': '27'
};

/** ESPN team id for an NBA tricode (any of ESPN's or the standard spellings). */
export function nbaTeamId(teamTricode: string): string | null {
  return TEAM_ID_MAP[normalizeTeamTricode(teamTricode)] ?? null;
}

/**
 * Get a team's regular-season statistics from ESPN for one season.
 * espnSeasonYear is the season's end year (2027 for 2026-27). Without it ESPN
 * returns its own default, which is the previous season until the new
 * regular season starts. A season with no games yet returns no categories.
 */
export async function getTeamStats(league: LeagueId, teamId: string, espnSeasonYear: number): Promise<any> {
  try {
    const url = `${espnUrls(league).site}/teams/${teamId}/statistics?season=${espnSeasonYear}&seasontype=2`;

    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch team stats:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return null;
  }
}

/**
 * Get a team's last N completed games for one season, regular season and
 * playoffs combined, oldest first. Preseason games are excluded.
 * espnSeasonYear is the season's end year (2027 for 2026-27).
 */
export async function getTeamGameLog(league: LeagueId, teamId: string, espnSeasonYear: number, limit: number = 10): Promise<any[]> {
  try {
    const base = `${espnUrls(league).site}/teams/${teamId}/schedule?season=${espnSeasonYear}`;
    const [regular, postseason] = await Promise.all(
      [2, 3].map(async (seasonType) => {
        const res = await fetch(`${base}&seasontype=${seasonType}`, { next: { revalidate: 600 } });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.events ?? []) as any[];
      })
    );

    return [...regular, ...postseason]
      .filter((event: any) => event.competitions?.[0]?.status?.type?.completed)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-limit);
  } catch (error) {
    console.error('Error fetching team game log:', error);
    return [];
  }
}

export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  gamesPlayed: number;
  height: string;
  weight: string;
}

/**
 * Fetch individual player stats with timeout and retry logic
 */
async function fetchPlayerStats(league: LeagueId, playerId: string, retries: number = 2): Promise<PlayerStats> {
  const defaultStats: PlayerStats = { ppg: 0, rpg: 0, apg: 0, fgPct: 0, gamesPlayed: 0, height: '-', weight: '-' };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use the same endpoint that works for the players page
      const url = `${espnUrls(league).common}/athletes/${playerId}`;

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`Failed to fetch stats for player ${playerId}: ${response.status}`);
        if (attempt < retries) continue;
        return defaultStats;
      }

      const data = await response.json();
      const athlete = data.athlete;

      if (!athlete) {
        console.log(`No athlete data for player ${playerId}`);
        return defaultStats;
      }

      // Extract height and weight from athlete bio
      const height = athlete.displayHeight || athlete.height?.displayValue || '-';
      const weight = athlete.displayWeight || athlete.weight?.displayValue || '-';

      // Extract stats from statsSummary (same approach as espn-stats-leaders.ts)
      const statsArray = athlete.statsSummary?.statistics || [];

      const getStat = (name: string): number => {
        const stat = statsArray.find((s: any) => s.name === name);
        const value = stat?.value ?? stat?.displayValue;
        if (value === undefined || value === null) return 0;
        return typeof value === 'string' ? parseFloat(value) : value;
      };

      const stats: PlayerStats = {
        ppg: getStat('avgPoints'),
        rpg: getStat('avgRebounds'),
        apg: getStat('avgAssists'),
        fgPct: getStat('fieldGoalPct'),
        gamesPlayed: getStat('gamesPlayed') || getStat('GP') || 0,
        height,
        weight,
      };

      // Only return if we got at least PPG
      if (stats.ppg > 0 || stats.rpg > 0 || stats.apg > 0) {
        return stats;
      }

      // If no stats from statsSummary, try the categories in statistics
      const categories = athlete.statistics?.splits?.categories || [];
      categories.forEach((cat: any) => {
        cat.stats?.forEach((stat: any) => {
          if (stat.name === 'avgPoints' && stat.displayValue) stats.ppg = parseFloat(stat.displayValue) || 0;
          if (stat.name === 'avgRebounds' && stat.displayValue) stats.rpg = parseFloat(stat.displayValue) || 0;
          if (stat.name === 'avgAssists' && stat.displayValue) stats.apg = parseFloat(stat.displayValue) || 0;
          if (stat.name === 'fieldGoalPct' && stat.displayValue) stats.fgPct = parseFloat(stat.displayValue) || 0;
          if ((stat.name === 'gamesPlayed' || stat.name === 'GP') && stat.displayValue) stats.gamesPlayed = parseInt(stat.displayValue) || 0;
        });
      });

      return stats;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`Timeout fetching stats for player ${playerId}, attempt ${attempt + 1}/${retries + 1}`);
      } else {
        console.log(`Error fetching stats for player ${playerId}:`, error.message);
      }

      if (attempt < retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
    }
  }

  return defaultStats;
}

/** Regular-season field-goal percentage from ESPN's core season stats (0 if none). */
async function fetchSeasonFieldGoalPct(league: LeagueId, playerId: string, espnSeasonYear: number): Promise<number> {
  try {
    const res = await fetch(`${espnUrls(league).core}/seasons/${espnSeasonYear}/types/2/athletes/${playerId}/statistics`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    for (const cat of data.splits?.categories ?? []) {
      const stat = cat.stats?.find((x: any) => x.name === 'fieldGoalPct');
      if (stat && Number.isFinite(Number(stat.value))) return Number(stat.value);
    }
  } catch {
    // fall through
  }
  return 0;
}

/**
 * Get team roster from ESPN with player stats
 */
export async function getTeamRosterWithStats(league: LeagueId, teamId: string, espnSeasonYear?: number): Promise<any[]> {
  try {
    const url = `${espnUrls(league).site}/teams/${teamId}/roster`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch team roster:', response.statusText);
      return [];
    }

    const data = await response.json();
    const athletes = data.athletes || [];

    console.log(`Fetching stats for ${athletes.length} players on ${league} team ${teamId}...`);

    // Fetch stats for each player in batches to avoid overwhelming the API
    const batchSize = 5;
    const rosterWithStats: any[] = [];

    for (let i = 0; i < athletes.length; i += batchSize) {
      const batch = athletes.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (athlete: any) => {
          // Ensure jersey is a string, not an object
          let jerseyValue = athlete.jersey;
          if (typeof jerseyValue === 'object' && jerseyValue !== null) {
            jerseyValue = jerseyValue.value || jerseyValue.displayValue || '';
          }

          const playerId = String(athlete.id || '');
          const playerName = String(athlete.displayName || athlete.fullName || '');

          // Fetch stats with retry logic
          const stats = await fetchPlayerStats(league, playerId);
          // ESPN's WNBA stat summary has no FG%; take it from the season stats.
          if (league === 'wnba' && !stats.fgPct && espnSeasonYear) {
            stats.fgPct = await fetchSeasonFieldGoalPct(league, playerId, espnSeasonYear);
          }

          console.log(`  ${playerName}: PPG=${stats.ppg}, RPG=${stats.rpg}, APG=${stats.apg}, FG%=${stats.fgPct}`);

          return {
            id: playerId,
            displayName: playerName,
            jersey: String(jerseyValue || ''),
            position: String(athlete.position?.abbreviation || 'N/A'),
            headshot: athlete.headshot?.href || null,
            stats,
          };
        })
      );

      rosterWithStats.push(...batchResults);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < athletes.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Sort by PPG descending so top scorers appear first
    rosterWithStats.sort((a, b) => b.stats.ppg - a.stats.ppg);

    console.log(`Successfully loaded roster for ${league} team ${teamId} with ${rosterWithStats.length} players`);
    return rosterWithStats;
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}
