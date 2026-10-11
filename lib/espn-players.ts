// Player data from ESPN: rosters, search, bio, season stats and game logs.
// Every exported function takes the league first.

import { espnUrls, type LeagueId } from './leagues';

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
    /** ESPN logo URL. Set for WNBA results, whose logos can't be derived from the abbreviation. */
    logo?: string;
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

    const url = `${espnUrls('nba').site}/teams/${teamId}/roster`;

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
 * Current rosters for every WNBA team. Teams come from ESPN's team list
 * (keyed by franchise id), since WNBA abbreviations collide with NBA ones.
 */
async function getWnbaRosters(): Promise<ESPNPlayer[][]> {
  const { site } = espnUrls('wnba');
  try {
    const res = await fetch(`${site}/teams`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const teams: any[] = (data.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t: any) => t.team);
    return await Promise.all(
      teams.map(async (team: any) => {
        try {
          const r = await fetch(`${site}/teams/${team.id}/roster`, { next: { revalidate: 3600 } });
          if (!r.ok) return [];
          const roster = await r.json();
          return (roster.athletes ?? []).map((athlete: any) => ({
            id: athlete.id,
            firstName: athlete.firstName || '',
            lastName: athlete.lastName || '',
            displayName: athlete.displayName || athlete.fullName || '',
            jersey: athlete.jersey,
            position: athlete.position,
            team: {
              id: String(team.id),
              abbreviation: team.abbreviation,
              logo: team.logos?.[0]?.href,
            },
            height: athlete.height,
            weight: athlete.weight,
          }));
        } catch {
          return [];
        }
      }),
    );
  } catch (error) {
    console.error('Error fetching WNBA rosters:', error);
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
export async function searchAllPlayers(league: LeagueId, query: string): Promise<ESPNPlayer[]> {
  if (!query || query.length < 2) return [];

  const trimmedQuery = query.trim();
  const allPlayers: ESPNPlayer[] = [];

  // Fetch rosters from all teams in parallel
  const rosters = league === 'nba'
    ? await Promise.all(NBA_TEAMS.map(team => getTeamRoster(team)))
    : await getWnbaRosters();

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
export async function getPlayerDetails(league: LeagueId, playerId: string): Promise<any> {
  console.log(`Fetching ${league} player details for ID: ${playerId}`);

  // The league is part of the URL, so another league's player id returns 404.
  const url = `${espnUrls(league).common}/athletes/${playerId}`;
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
 * Get player game log (recent games) with player stats - robust error handling
 */
export async function getPlayerGameLog(league: LeagueId, playerId: string, espnSeasonYear: number, limit: number = 10): Promise<any[]> {
  console.log(`Fetching game log with stats for player ID: ${playerId} (season ${espnSeasonYear})`);
  const seasonQuery = `?season=${espnSeasonYear}`;

  // Fetch from web API which includes player stats per game
  const webUrl = `${espnUrls(league).web}/athletes/${playerId}/gamelog${seasonQuery}`;
  const webResponse = await robustFetch(webUrl, {
    timeout: 10000,
    retries: 3,
    description: `detailed game log for player ${playerId}`,
  });

  // Also fetch basic game log for game info (date, opponent, score)
  const basicUrl = `${espnUrls(league).common}/athletes/${playerId}/gamelog${seasonQuery}`;
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
      // Regular season, play-in and playoff games. Preseason games are skipped.
      if (seasonType.displayName?.includes('Preseason')) continue;

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
      // Events outside the season types kept above (i.e. preseason) are dropped.
      if (!playerStatsMap[eventId]) return;
      const playerStats = playerStatsMap[eventId];

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
 * Regular-season per-game averages for one player in one season, from ESPN's
 * core API. espnSeasonYear is the season's end year (2016 for 2015-16).
 * Returns null when the player has no stats that season, including a current
 * season that hasn't started yet. Shape: { statistics: [{ name, displayName, value, displayValue }] }.
 */
export async function getPlayerSeasonStats(league: LeagueId, playerId: string, espnSeasonYear: number): Promise<any> {
  const url = `${espnUrls(league).core}/seasons/${espnSeasonYear}/types/2/athletes/${playerId}/statistics`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const statistics: any[] = [];
    const seen = new Set<string>();
    for (const category of data.splits?.categories ?? []) {
      for (const stat of category.stats ?? []) {
        if (seen.has(stat.name)) continue;
        seen.add(stat.name);
        statistics.push({
          name: stat.name,
          displayName: stat.displayName,
          value: stat.value,
          displayValue: stat.displayValue,
        });
      }
    }
    return statistics.length > 0 ? { statistics } : null;
  } catch (error) {
    console.log(`Error fetching season ${espnSeasonYear} stats for player ${playerId}:`, error);
    return null;
  }
}
