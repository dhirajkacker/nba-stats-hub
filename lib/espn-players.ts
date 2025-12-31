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

interface ESPNTeamRoster {
  team: {
    id: string;
    abbreviation: string;
  };
  athletes: ESPNPlayer[];
}

// Normalize team tricode to handle variations
function normalizeTeamTricode(code: string): string {
  const normalized: { [key: string]: string } = {
    'GS': 'GSW',
    'NO': 'NOP',
    'SA': 'SAS',
    'NY': 'NYK',
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
 * Search all NBA players across all teams
 * This fetches rosters from all teams and searches
 */
export async function searchAllPlayers(query: string): Promise<ESPNPlayer[]> {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const allPlayers: ESPNPlayer[] = [];

  // Fetch rosters from all teams in parallel
  const rosterPromises = NBA_TEAMS.map(team => getTeamRoster(team));
  const rosters = await Promise.all(rosterPromises);

  // Flatten all rosters into one array
  rosters.forEach(roster => {
    allPlayers.push(...roster);
  });

  // Search by player name
  return allPlayers.filter(player =>
    player.displayName.toLowerCase().includes(lowerQuery) ||
    player.firstName.toLowerCase().includes(lowerQuery) ||
    player.lastName.toLowerCase().includes(lowerQuery)
  ).slice(0, 50); // Limit to 50 results
}

/**
 * Get player details by ID from ESPN
 */
export async function getPlayerDetails(playerId: string): Promise<any> {
  try {
    const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;

    console.log(`Fetching player details for ID: ${playerId}`);

    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      console.log(`Player not found for ID ${playerId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`Successfully fetched player: ${data.athlete?.displayName || 'Unknown'}`);
    return data.athlete;
  } catch (error) {
    console.log(`Error fetching player details for ID ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player statistics (uses stats summary from athlete details)
 */
export async function getPlayerStats(playerId: string): Promise<any> {
  try {
    // Stats are included in the athlete details response
    const player = await getPlayerDetails(playerId);
    if (player?.statsSummary) {
      console.log(`Stats found for ${player.displayName}`);
    } else {
      console.log(`No stats summary available for player ID ${playerId}`);
    }
    return player?.statsSummary || null;
  } catch (error) {
    console.log(`Could not fetch player stats for ID ${playerId}:`, error);
    return null;
  }
}

/**
 * Get player game log (recent games)
 */
export async function getPlayerGameLog(playerId: string, limit: number = 10): Promise<any[]> {
  try {
    const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog`;

    console.log(`Fetching game log for player ID: ${playerId}`);

    const response = await fetch(url, {
      next: { revalidate: 600 }, // 10 minutes cache
    });

    if (!response.ok) {
      console.log(`Game log not available for player ID ${playerId} (${response.status})`);
      return [];
    }

    const data = await response.json();

    // Events is an object keyed by event ID, convert to array
    const eventsObj = data?.events || {};
    const gamesArray = Object.values(eventsObj);

    console.log(`Found ${gamesArray.length} games for player ID ${playerId}`);

    // Sort by date descending (most recent first)
    gamesArray.sort((a: any, b: any) => {
      const dateA = new Date(a.gameDate).getTime();
      const dateB = new Date(b.gameDate).getTime();
      return dateB - dateA;
    });

    return gamesArray.slice(0, limit);
  } catch (error) {
    console.log(`Could not fetch game log for player ID ${playerId}:`, error);
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
