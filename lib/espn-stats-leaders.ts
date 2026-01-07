// Fetch NBA stats leaders from ESPN API
// This provides real-time, accurate player data with current teams and stats

// Minimum PPG threshold for a player to be in the "top scorers" list
// This ensures data quality - if a player has lower PPG, they shouldn't be shown
const MIN_PPG_FOR_TOP_SCORERS = 18.0;

export interface ESPNStatsLeader {
  id: string;
  displayName: string;
  team: {
    abbreviation: string;
  };
  position?: {
    abbreviation: string;
  };
  jersey?: string;
  height?: string;
  weight?: string;
  stats: {
    gamesPlayed: number;
    ppg: number;
    rpg?: number;
    apg?: number;
    fgPct?: number;
    fg3Pct?: number;
    ftPct?: number;
    mpg?: number;
    fgm?: number;
    fga?: number;
    fg3m?: number;
    fg3a?: number;
    ftm?: number;
    fta?: number;
  };
}

export interface FetchStatus {
  source: 'espn-leaders' | 'espn-teams' | 'none';
  playersFound: number;
  errors: string[];
  retryAttempts: number;
}

// Track fetch status for debugging and user feedback
let lastFetchStatus: FetchStatus = {
  source: 'none',
  playersFound: 0,
  errors: [],
  retryAttempts: 0,
};

export function getLastFetchStatus(): FetchStatus {
  return { ...lastFetchStatus };
}

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  timeoutMs: number = 5000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      console.log(`Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError') {
        console.log(`Attempt ${attempt}/${maxRetries} timed out after ${timeoutMs}ms`);
      } else {
        console.log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      }
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Extract athlete ID from ESPN API $ref URL
 */
function extractAthleteId(refUrl: string): string | null {
  const match = refUrl.match(/athletes\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch player details from ESPN athlete API
 */
async function fetchPlayerById(playerId: string): Promise<ESPNStatsLeader | null> {
  try {
    const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;
    const response = await fetchWithRetry(url, {}, 2, 3000);
    const data = await response.json();
    const athlete = data.athlete;

    if (!athlete) {
      return null;
    }

    const stats = athlete.statsSummary?.statistics || [];
    const getStat = (name: string): number => {
      const stat = stats.find((s: any) => s.name === name);
      const value = stat?.value || stat?.displayValue;
      if (value === undefined || value === null) return 0;
      return typeof value === 'string' ? parseFloat(value) : value;
    };

    const ppg = getStat('avgPoints');
    if (!ppg || ppg === 0) {
      return null;
    }

    return {
      id: athlete.id,
      displayName: athlete.displayName,
      team: { abbreviation: athlete.team?.abbreviation || 'NBA' },
      position: athlete.position,
      jersey: athlete.jersey,
      height: athlete.height,
      weight: athlete.weight,
      stats: {
        gamesPlayed: 0,
        ppg: getStat('avgPoints'),
        rpg: getStat('avgRebounds'),
        apg: getStat('avgAssists'),
        fgPct: getStat('fieldGoalPct'),
        fg3Pct: getStat('threePointFieldGoalPct'),
        ftPct: getStat('freeThrowPct'),
        mpg: getStat('avgMinutes'),
        fgm: getStat('avgFieldGoalsMade'),
        fga: getStat('avgFieldGoalsAttempted'),
        fg3m: getStat('avgThreePointFieldGoalsMade'),
        fg3a: getStat('avgThreePointFieldGoalsAttempted'),
        ftm: getStat('avgFreeThrowsMade'),
        fta: getStat('avgFreeThrowsAttempted'),
      },
    };
  } catch (error: any) {
    console.error(`Error fetching player ${playerId}:`, error.message);
    return null;
  }
}

/**
 * Get ESPN season year (ESPN uses next calendar year for current season)
 * e.g., 2025-26 season = 2026 in ESPN API
 */
function getESPNSeasonYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // If Oct-Dec, use next year; if Jan-Sep, use current year
  return month >= 10 ? year + 1 : year;
}

/**
 * PRIMARY SOURCE: Fetch top scorers from ESPN Leaders API
 * This API returns the actual statistical leaders
 */
async function fetchFromLeadersAPI(limit: number): Promise<ESPNStatsLeader[]> {
  const seasonYear = getESPNSeasonYear();
  const leadersUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${seasonYear}/types/2/leaders?lang=en&region=us`;

  console.log(`[Leaders API] Fetching from ESPN (season ${seasonYear})...`);

  const response = await fetchWithRetry(leadersUrl, {}, 3, 8000);
  const data = await response.json();

  if (!data.categories?.length) {
    throw new Error('No categories in leaders response');
  }

  // Find PPG category
  const ppgCategory = data.categories.find(
    (cat: any) => cat.abbreviation === 'PTS' || cat.name === 'pointsPerGame'
  );

  if (!ppgCategory?.leaders?.length) {
    throw new Error('PPG leaders category not found');
  }

  console.log(`[Leaders API] Found ${ppgCategory.leaders.length} PPG leaders`);

  // Extract athlete IDs
  const athleteIds: string[] = [];
  for (const leader of ppgCategory.leaders.slice(0, Math.min(limit + 10, ppgCategory.leaders.length))) {
    if (leader.athlete?.$ref) {
      const id = extractAthleteId(leader.athlete.$ref);
      if (id) athleteIds.push(id);
    }
  }

  console.log(`[Leaders API] Fetching details for ${athleteIds.length} players...`);

  // Fetch player details in parallel batches
  const players: ESPNStatsLeader[] = [];
  const batchSize = 10;

  for (let i = 0; i < athleteIds.length; i += batchSize) {
    const batch = athleteIds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(id => fetchPlayerById(id)));
    players.push(...results.filter((p): p is ESPNStatsLeader => p !== null));
  }

  return players;
}

/**
 * SECONDARY SOURCE: Fetch top scorers from all NBA teams
 * Falls back to this if Leaders API fails
 */
async function fetchFromTeamsAPI(limit: number): Promise<ESPNStatsLeader[]> {
  console.log('[Teams API] Fetching teams to gather player stats...');

  const teamsUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
  const response = await fetchWithRetry(teamsUrl, {}, 3, 8000);
  const data = await response.json();

  const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
  if (!teams.length) {
    throw new Error('No teams found');
  }

  console.log(`[Teams API] Found ${teams.length} teams, fetching rosters...`);

  const allPlayers: ESPNStatsLeader[] = [];
  const processedTeams: string[] = [];

  // Fetch players from each team
  for (const teamEntry of teams) {
    const team = teamEntry.team;
    if (!team?.id) continue;

    try {
      const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team.id}/roster`;
      const rosterResponse = await fetchWithRetry(rosterUrl, {}, 2, 5000);
      const rosterData = await rosterResponse.json();

      const athletes = rosterData.athletes || [];
      for (const athlete of athletes) {
        if (!athlete?.id) continue;

        // Get stats from athlete summary
        const stats = athlete.statsSummary?.statistics || [];
        const ppgStat = stats.find((s: any) => s.name === 'avgPoints');
        const ppg = ppgStat?.value || ppgStat?.displayValue;

        if (ppg && parseFloat(ppg) >= MIN_PPG_FOR_TOP_SCORERS) {
          const rpgStat = stats.find((s: any) => s.name === 'avgRebounds');
          const apgStat = stats.find((s: any) => s.name === 'avgAssists');
          const fgPctStat = stats.find((s: any) => s.name === 'fieldGoalPct');

          allPlayers.push({
            id: athlete.id,
            displayName: athlete.displayName || athlete.fullName,
            team: { abbreviation: team.abbreviation || 'NBA' },
            position: athlete.position,
            jersey: athlete.jersey,
            height: athlete.height,
            weight: athlete.weight,
            stats: {
              gamesPlayed: 0,
              ppg: parseFloat(ppg),
              rpg: rpgStat ? parseFloat(rpgStat.value || rpgStat.displayValue || 0) : 0,
              apg: apgStat ? parseFloat(apgStat.value || apgStat.displayValue || 0) : 0,
              fgPct: fgPctStat ? parseFloat(fgPctStat.value || fgPctStat.displayValue || 0) : 0,
            },
          });
        }
      }
      processedTeams.push(team.abbreviation);
    } catch (error: any) {
      console.log(`[Teams API] Failed to fetch roster for ${team.abbreviation}: ${error.message}`);
    }
  }

  console.log(`[Teams API] Processed ${processedTeams.length} teams, found ${allPlayers.length} qualifying players`);
  return allPlayers;
}

/**
 * Validate and filter players to ensure data quality
 */
function validateAndFilterPlayers(players: ESPNStatsLeader[], limit: number): ESPNStatsLeader[] {
  // Filter out players below minimum PPG threshold
  const validPlayers = players.filter(p => p.stats.ppg >= MIN_PPG_FOR_TOP_SCORERS);

  // Sort by PPG descending
  validPlayers.sort((a, b) => b.stats.ppg - a.stats.ppg);

  // Log data quality info
  const filtered = players.length - validPlayers.length;
  if (filtered > 0) {
    console.log(`[Validation] Filtered out ${filtered} players below ${MIN_PPG_FOR_TOP_SCORERS} PPG threshold`);
  }

  const result = validPlayers.slice(0, limit);

  // Sanity check: the 30th player should have at least MIN_PPG_FOR_TOP_SCORERS
  if (result.length > 0) {
    const lastPlayer = result[result.length - 1];
    console.log(`[Validation] Top ${result.length} scorers range: ${result[0].stats.ppg.toFixed(1)} - ${lastPlayer.stats.ppg.toFixed(1)} PPG`);

    if (lastPlayer.stats.ppg < MIN_PPG_FOR_TOP_SCORERS) {
      console.warn(`[Validation] WARNING: Last player ${lastPlayer.displayName} has only ${lastPlayer.stats.ppg.toFixed(1)} PPG`);
    }
  }

  return result;
}

/**
 * Fetch top NBA players by points per game
 * Tries multiple data sources with retry logic and validates results
 */
export async function getTopScorers(limit: number = 30): Promise<ESPNStatsLeader[]> {
  lastFetchStatus = {
    source: 'none',
    playersFound: 0,
    errors: [],
    retryAttempts: 0,
  };

  let players: ESPNStatsLeader[] = [];

  // Try primary source: ESPN Leaders API
  try {
    console.log('=== Attempting ESPN Leaders API ===');
    players = await fetchFromLeadersAPI(limit + 10); // Fetch extra to account for filtering
    lastFetchStatus.source = 'espn-leaders';
    lastFetchStatus.playersFound = players.length;
    console.log(`[Leaders API] SUCCESS: Got ${players.length} players`);
  } catch (error: any) {
    lastFetchStatus.errors.push(`Leaders API: ${error.message}`);
    console.error(`[Leaders API] FAILED: ${error.message}`);

    // Try secondary source: Teams API
    try {
      console.log('=== Falling back to ESPN Teams API ===');
      players = await fetchFromTeamsAPI(limit + 10);
      lastFetchStatus.source = 'espn-teams';
      lastFetchStatus.playersFound = players.length;
      console.log(`[Teams API] SUCCESS: Got ${players.length} players`);
    } catch (teamsError: any) {
      lastFetchStatus.errors.push(`Teams API: ${teamsError.message}`);
      console.error(`[Teams API] FAILED: ${teamsError.message}`);
    }
  }

  if (players.length === 0) {
    console.error('=== ALL DATA SOURCES FAILED ===');
    console.error('Errors:', lastFetchStatus.errors);
    return [];
  }

  // Validate and filter results
  const validatedPlayers = validateAndFilterPlayers(players, limit);
  lastFetchStatus.playersFound = validatedPlayers.length;

  console.log(`=== Final result: ${validatedPlayers.length} validated players ===`);
  return validatedPlayers;
}

/**
 * Fetch players by multiple stat categories for comprehensive coverage
 */
export async function getTopPlayersByAllStats(limit: number = 30): Promise<ESPNStatsLeader[]> {
  return getTopScorers(limit);
}
