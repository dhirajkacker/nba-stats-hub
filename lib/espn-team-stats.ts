// Fetch advanced team statistics from ESPN API

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

/**
 * Get team roster from ESPN
 */
export async function getTeamRosterWithStats(teamTricode: string): Promise<any[]> {
  try {
    const normalizedTricode = normalizeTeamTricode(teamTricode);
    const teamId = TEAM_ID_MAP[normalizedTricode];
    if (!teamId) return [];

    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error('Failed to fetch team roster:', response.statusText);
      return [];
    }

    const data = await response.json();
    const athletes = data.athletes || [];

    const mappedRoster = athletes.map((athlete: any) => {
      // Ensure jersey is a string, not an object
      let jerseyValue = athlete.jersey;
      if (typeof jerseyValue === 'object' && jerseyValue !== null) {
        jerseyValue = jerseyValue.value || jerseyValue.displayValue || '';
      }

      const playerId = String(athlete.id || '');
      console.log(`Roster player: ${athlete.displayName} -> ID: ${playerId}`);

      return {
        id: playerId,
        displayName: String(athlete.displayName || athlete.fullName || ''),
        jersey: String(jerseyValue || ''),
        position: String(athlete.position?.abbreviation || 'N/A'),
        headshot: athlete.headshot?.href || null,
        statistics: athlete.statistics || [],
      };
    });

    return mappedRoster;
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}
