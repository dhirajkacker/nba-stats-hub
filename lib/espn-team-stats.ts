// Fetch advanced team statistics from ESPN API

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

/**
 * Get team statistics from ESPN
 */
export async function getTeamStats(teamTricode: string): Promise<any> {
  try {
    const normalizedTricode = normalizeTeamTricode(teamTricode);
    const teamId = TEAM_ID_MAP[normalizedTricode];
    if (!teamId) return null;

    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/statistics`;

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
 * Get team game log (recent games)
 */
export async function getTeamGameLog(teamTricode: string, limit: number = 10): Promise<any[]> {
  try {
    const normalizedTricode = normalizeTeamTricode(teamTricode);
    const teamId = TEAM_ID_MAP[normalizedTricode];
    if (!teamId) return [];

    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}`;

    const response = await fetch(url, {
      next: { revalidate: 600 }, // 10 minutes cache
    });

    if (!response.ok) {
      console.error('Failed to fetch team game log:', response.statusText);
      return [];
    }

    const data = await response.json();

    // Extract recent games from the team data
    const events = data?.team?.nextEvent || data?.team?.previousEvent || [];

    // Get season schedule to extract recent games
    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`;

    const scheduleResponse = await fetch(scheduleUrl, {
      next: { revalidate: 600 },
    });

    if (!scheduleResponse.ok) {
      return [];
    }

    const scheduleData = await scheduleResponse.json();

    // Get completed games from the schedule
    const allEvents = scheduleData?.events || [];
    const completedGames = allEvents
      .filter((event: any) => event.competitions?.[0]?.status?.type?.completed)
      .slice(-limit); // Get last N games

    return completedGames;
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
async function fetchPlayerStats(playerId: string, retries: number = 2): Promise<PlayerStats> {
  const defaultStats: PlayerStats = { ppg: 0, rpg: 0, apg: 0, fgPct: 0, gamesPlayed: 0, height: '-', weight: '-' };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use the same endpoint that works for the players page
      const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;

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

/**
 * Get team roster from ESPN with player stats
 */
export async function getTeamRosterWithStats(teamTricode: string): Promise<any[]> {
  try {
    const normalizedTricode = normalizeTeamTricode(teamTricode);
    const teamId = TEAM_ID_MAP[normalizedTricode];
    if (!teamId) return [];

    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;

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

    console.log(`Fetching stats for ${athletes.length} players on ${teamTricode}...`);

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
          const stats = await fetchPlayerStats(playerId);

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

    console.log(`Successfully loaded roster for ${teamTricode} with ${rosterWithStats.length} players`);
    return rosterWithStats;
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}
