// Fetch all NBA players from ESPN API

export interface ESPNPlayer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  jersey?: string;
  position?: {
    abbreviation: string;
  };
  team?: {
    id: string;
    abbreviation: string;
  };
  height?: string;
  weight?: string;
}

/**
 * Robust fetch with timeout, retry, and exponential backoff
 */
async function robustFetch(
  url: string,
  options: {
    timeout?: number;
    retries?: number;
    description?: string;
  } = {}
): Promise<Response | null> {
  const { timeout = 8000, retries = 2, description = 'resource' } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`Failed to fetch ${description}: ${response.status}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        return null;
      }

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`Timeout fetching ${description}, attempt ${attempt + 1}/${retries + 1}`);
      } else {
        console.log(`Error fetching ${description}:`, error.message);
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
    }
  }

  return null;
}

interface ESPNTeamRoster {
  team: {
    id: string;
    abbreviation: string;
  };
  athletes: ESPNPlayer[];
}

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

const NBA_TEAMS = [
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
  'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
  'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'
];

const TEAM_ID_MAP: { [key: string]: string } = {
  'ATL': '1', 'BOS': '2', 'BKN': '17', 'CHA': '30', 'CHI': '4',
  'CLE': '5', 'DAL': '6', 'DEN': '7', 'DET': '8', 'GSW': '9',
  'HOU': '10', 'IND': '11', 'LAC': '12', 'LAL': '13', 'MEM': '29',
  'MIA': '14', 'MIL': '15', 'MIN': '16', 'NOP': '3', 'NYK': '18',
  'OKC': '25', 'ORL': '19', 'PHI': '20', 'PHX': '21', 'POR': '22',
  'SAC': '23', 'SAS': '24', 'TOR': '28', 'UTA': '26', 'WAS': '27'
};

/**
 * Fetch all players for a specific team from ESPN
 */
export async function getTeamRoster(teamTricode: string): Promise<ESPNPlayer[]> {
  try {
    const normalizedTricode = normalizeTeamTricode(teamTricode);
    const teamId = TEAM_ID_MAP[normalizedTricode];
    if (!teamId) return [];

    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour (rosters change infrequently)
    });

    if (!response.ok) {
      console.error('Failed to fetch team roster:', response.statusText);
      return [];
    }

    const data = await response.json();

    // Extract athletes from the roster
    const athletes = data.athletes || [];

    return athletes.map((athlete: any) => ({
      id: athlete.id,
      firstName: athlete.firstName || '',
      lastName: athlete.lastName || '',
      displayName: athlete.displayName || athlete.fullName || '',
      jersey: athlete.jersey,
      position: athlete.position,
      team: {
        id: teamId,
        abbreviation: normalizedTricode,
      },
      height: athlete.height,
      weight: athlete.weight,
    }));
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}

/**
 * Calculate similarity score for fuzzy matching
 * Higher score = better match
 */
function calculateMatchScore(playerName: string, query: string): number {
  const lowerName = playerName.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  // Exact match - highest priority
  if (lowerName === lowerQuery) return 1000;

  // Starts with query - very high priority
  if (lowerName.startsWith(lowerQuery)) return 500;

  // Words in name start with query (e.g., "Dave" matches "David")
  const nameWords = lowerName.split(/\s+/);
  const queryWords = lowerQuery.split(/\s+/);

  // Check if any name word starts with any query word
  let wordMatchScore = 0;
  for (const nameWord of nameWords) {
    for (const queryWord of queryWords) {
      if (nameWord.startsWith(queryWord)) {
        wordMatchScore += 300;
      } else if (nameWord.includes(queryWord)) {
        wordMatchScore += 100;
      }
    }
  }

  if (wordMatchScore > 0) return wordMatchScore;

  // Contains query - medium priority
  if (lowerName.includes(lowerQuery)) return 50;

  // No match
  return 0;
}

/**
 * Search all NBA players across all teams
 * This fetches rosters from all teams and searches with fuzzy matching
 */
export async function searchAllPlayers(query: string): Promise<ESPNPlayer[]> {
  if (!query || query.length < 2) return [];

  const trimmedQuery = query.trim();
  const allPlayers: ESPNPlayer[] = [];

  // Fetch rosters from all teams in parallel
  const rosterPromises = NBA_TEAMS.map(team => getTeamRoster(team));
  const rosters = await Promise.all(rosterPromises);

  // Flatten all rosters into one array
  rosters.forEach(roster => {
    allPlayers.push(...roster);
  });

  // Score each player and filter matches
  const scoredPlayers = allPlayers
    .map(player => {
      // Calculate scores for different name fields
      const displayNameScore = calculateMatchScore(player.displayName, trimmedQuery);
      const firstNameScore = calculateMatchScore(player.firstName, trimmedQuery);
      const lastNameScore = calculateMatchScore(player.lastName, trimmedQuery);

      // Use the highest score
      const maxScore = Math.max(displayNameScore, firstNameScore, lastNameScore);

      return { player, score: maxScore };
    })
    .filter(item => item.score > 0) // Only include matches
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 50) // Limit to 50 results
    .map(item => item.player);

  return scoredPlayers;
}

/**
 * Get player details by ID from ESPN with robust error handling
 */
export async function getPlayerDetails(playerId: string): Promise<any> {
  console.log(`Fetching player details for ID: ${playerId}`);

  const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;
  const response = await robustFetch(url, {
    timeout: 10000,
    retries: 3,
    description: `player details for ${playerId}`,
  });

  if (!response) {
    console.log(`Player not found for ID ${playerId}`);
    return null;
  }

  try {
    const data = await response.json();
    const athlete = data.athlete;

    if (!athlete) {
      console.log(`No athlete data in response for ID ${playerId}`);
      return null;
    }

    console.log(`Successfully fetched player: ${athlete.displayName || 'Unknown'}`);

    // Normalize height and weight - ESPN returns these in different formats
    let height = athlete.displayHeight || athlete.height;
    let weight = athlete.displayWeight || athlete.weight;

    // Handle object formats
    if (typeof height === 'object' && height !== null) {
      height = height.displayValue || height.value || null;
    }
    if (typeof weight === 'object' && weight !== null) {
      weight = weight.displayValue || weight.value || null;
    }

    // Clean up weight (remove "lbs" if present, we'll add it in display)
    if (typeof weight === 'string') {
      weight = weight.replace(/\s*lbs?\s*/gi, '').trim();
    }

    return {
      ...athlete,
      height: height || null,
      weight: weight || null,
    };
  } catch (error) {
    console.log(`Error parsing player details for ID ${playerId}:`, error);
    return null;
  }
}

/**
 * Get comprehensive player statistics with robust error handling
 * Fetches from multiple sources and combines data
 */
export async function getPlayerStats(playerId: string): Promise<any> {
  console.log(`Fetching stats for player ID: ${playerId}`);

  // Primary source: athlete details endpoint (includes statsSummary)
  const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;
  const response = await robustFetch(url, {
    timeout: 10000,
    retries: 3,
    description: `player stats for ${playerId}`,
  });

  if (!response) {
    console.log(`Could not fetch stats for player ID ${playerId}`);
    return null;
  }

  try {
    const data = await response.json();
    const athlete = data.athlete;

    if (!athlete) {
      return null;
    }

    // Get stats from statsSummary (primary source)
    const statsSummary = athlete.statsSummary?.statistics || [];

    // Start with basic stats from statsSummary
    const allStats = [...statsSummary];
    const existingNames = new Set(statsSummary.map((s: any) => s.name));

    // Try to fetch comprehensive stats from web API
    const webStatsUrl = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats`;
    const webResponse = await robustFetch(webStatsUrl, {
      timeout: 8000,
      retries: 2,
      description: `comprehensive stats for ${playerId}`,
    });

    if (webResponse) {
      try {
        const webData = await webResponse.json();
        const categories = webData.categories || [];

        // Find the averages category which has per-game stats
        const averagesCategory = categories.find((c: any) => c.name === 'averages');
        if (averagesCategory) {
          const labels = averagesCategory.labels || [];
          const totals = averagesCategory.totals || [];
          const displayNames = averagesCategory.displayNames || [];

          // Map labels to stat values
          const statMappings: { [key: string]: { name: string; index: number } } = {
            'GP': { name: 'gamesPlayed', index: labels.indexOf('GP') },
            'GS': { name: 'gamesStarted', index: labels.indexOf('GS') },
            'MIN': { name: 'avgMinutes', index: labels.indexOf('MIN') },
            'FG%': { name: 'fieldGoalPct', index: labels.indexOf('FG%') },
            '3P%': { name: 'threePointFieldGoalPct', index: labels.indexOf('3P%') },
            'FT%': { name: 'freeThrowPct', index: labels.indexOf('FT%') },
            'OR': { name: 'avgOffensiveRebounds', index: labels.indexOf('OR') },
            'DR': { name: 'avgDefensiveRebounds', index: labels.indexOf('DR') },
            'REB': { name: 'avgRebounds', index: labels.indexOf('REB') },
            'AST': { name: 'avgAssists', index: labels.indexOf('AST') },
            'STL': { name: 'avgSteals', index: labels.indexOf('STL') },
            'BLK': { name: 'avgBlocks', index: labels.indexOf('BLK') },
            'TO': { name: 'avgTurnovers', index: labels.indexOf('TO') },
            'PF': { name: 'avgFouls', index: labels.indexOf('PF') },
            'PTS': { name: 'avgPoints', index: labels.indexOf('PTS') },
          };

          for (const [label, mapping] of Object.entries(statMappings)) {
            if (mapping.index >= 0 && mapping.index < totals.length && !existingNames.has(mapping.name)) {
              const value = totals[mapping.index];
              // Parse value - handle formats like "6.9-14.1" for FG
              let displayValue = value;
              let numValue = parseFloat(value);

              // Skip if it's a compound stat like "6.9-14.1"
              if (typeof value === 'string' && value.includes('-') && !value.startsWith('-')) {
                continue;
              }

              if (!isNaN(numValue)) {
                allStats.push({
                  name: mapping.name,
                  displayName: displayNames[mapping.index] || label,
                  value: numValue,
                  displayValue: displayValue,
                });
                existingNames.add(mapping.name);
              }
            }
          }

          console.log(`Added ${allStats.length - statsSummary.length} stats from web API`);
        }
      } catch (webError) {
        console.log(`Could not parse web stats for ${playerId}:`, webError);
      }
    }

    console.log(`Found ${allStats.length} total stats for ${athlete.displayName}`);
    console.log(`Available stats: ${allStats.map((s: any) => s.name).join(', ')}`);

    return {
      statistics: allStats,
      displayName: athlete.displayName,
    };
  } catch (error) {
    console.log(`Error parsing player stats for ID ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player game log (recent games) with player stats - robust error handling
 */
export async function getPlayerGameLog(playerId: string, limit: number = 10): Promise<any[]> {
  console.log(`Fetching game log with stats for player ID: ${playerId}`);

  // Fetch from web API which includes player stats per game
  const webUrl = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`;
  const webResponse = await robustFetch(webUrl, {
    timeout: 10000,
    retries: 3,
    description: `detailed game log for player ${playerId}`,
  });

  // Also fetch basic game log for game info (date, opponent, score)
  const basicUrl = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`;
  const basicResponse = await robustFetch(basicUrl, {
    timeout: 10000,
    retries: 2,
    description: `basic game log for player ${playerId}`,
  });

  // Get basic game info
  const basicGamesMap: { [key: string]: any } = {};
  if (basicResponse) {
    try {
      const basicData = await basicResponse.json();
      const eventsObj = basicData?.events || {};
      Object.entries(eventsObj).forEach(([id, game]: [string, any]) => {
        basicGamesMap[id] = game;
      });
    } catch (e) {
      console.log(`Error parsing basic game log:`, e);
    }
  }

  // Get detailed player stats from web API
  if (!webResponse) {
    console.log(`Web game log not available for player ID ${playerId}`);
    // Fall back to basic games without player stats
    const games = Object.values(basicGamesMap);
    games.sort((a: any, b: any) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());
    return games.slice(0, limit);
  }

  try {
    const webData = await webResponse.json();
    const labels = webData.labels || [];
    const events = webData.events || {};
    const seasonTypes = webData.seasonTypes || [];

    // Create a map of event ID to player stats
    const playerStatsMap: { [key: string]: any } = {};

    // Process events from seasonTypes (contains stats array per game)
    for (const seasonType of seasonTypes) {
      // Only process regular season games
      if (!seasonType.displayName?.includes('Regular')) continue;

      const categories = seasonType.categories || [];
      for (const category of categories) {
        const gameEvents = category.events || [];
        for (const gameEvent of gameEvents) {
          const eventId = gameEvent.eventId;
          const stats = gameEvent.stats || [];

          // Map stats to labels
          const playerStats: { [key: string]: string | number } = {};
          labels.forEach((label: string, index: number) => {
            if (index < stats.length) {
              playerStats[label] = stats[index];
            }
          });

          playerStatsMap[eventId] = playerStats;
        }
      }
    }

    // Combine basic game info with player stats
    const combinedGames: any[] = [];

    // Use events from web API for game info (they have more complete data)
    Object.entries(events).forEach(([eventId, gameInfo]: [string, any]) => {
      const playerStats = playerStatsMap[eventId] || {};

      combinedGames.push({
        ...gameInfo,
        playerStats: {
          pts: playerStats['PTS'] || '-',
          reb: playerStats['REB'] || '-',
          ast: playerStats['AST'] || '-',
          stl: playerStats['STL'] || '-',
          blk: playerStats['BLK'] || '-',
          min: playerStats['MIN'] || '-',
          fgPct: playerStats['FG%'] || '-',
          fg3Pct: playerStats['3P%'] || '-',
          to: playerStats['TO'] || '-',
        },
      });
    });

    console.log(`Found ${combinedGames.length} games with player stats for player ID ${playerId}`);

    // Sort by date descending (most recent first)
    combinedGames.sort((a: any, b: any) => {
      const dateA = new Date(a.gameDate).getTime();
      const dateB = new Date(b.gameDate).getTime();
      return dateB - dateA;
    });

    return combinedGames.slice(0, limit);
  } catch (error) {
    console.log(`Error parsing game log for player ID ${playerId}:`, error);
    return [];
  }
}

/**
 * Find player in team rosters by player ID (fallback for players without athlete pages)
 */
export async function findPlayerInRosters(playerId: string): Promise<ESPNPlayer | null> {
  try {
    console.log(`Searching for player ID ${playerId} in team rosters (fallback)`);

    // Search through all team rosters to find the player
    for (const teamTricode of NBA_TEAMS) {
      const roster = await getTeamRoster(teamTricode);
      const player = roster.find(p => p.id === playerId);

      if (player) {
        console.log(`Found player ${player.displayName} in ${teamTricode} roster`);
        return player;
      }
    }

    console.log(`Player ID ${playerId} not found in any team roster`);
    return null;
  } catch (error) {
    console.log(`Error searching rosters for player ID ${playerId}:`, error);
    return null;
  }
}
