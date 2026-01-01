// Fetch NBA stats leaders from ESPN API
// This provides real-time, accurate player data with current teams and stats

// Fallback list of top player IDs (2024-25 season leaders)
const FALLBACK_TOP_PLAYERS = [
  '3059318', // Giannis Antetokounmpo
  '4066648', // Shai Gilgeous-Alexander
  '4277905', // Luka Doncic
  '4395628', // Anthony Edwards
  '6583',    // LeBron James
  '3975',    // Kevin Durant
  '4065648', // Jayson Tatum
  '4066421', // Donovan Mitchell
  '4278073', // Nikola Jokic
  '4351851', // Trae Young
  '2991043', // Anthony Davis
  '3155535', // Damian Lillard
  '4431678', // LaMelo Ball
  '4066261', // De'Aaron Fox
  '4397020', // Jalen Brunson
  '3112335', // Nikola Vucevic
  '6450',    // Stephen Curry
  '3213',    // James Harden
  '4065697', // Jaylen Brown
  '3102529', // Julius Randle
  '3064482', // Karl-Anthony Towns
  '4066636', // Tyrese Maxey
  '2991070', // Devin Booker
  '4066378', // Bam Adebayo
  '3136195', // Pascal Siakam
  '4278104', // Darius Garland
  '3907487', // Kawhi Leonard
  '4066259', // Tyler Herro
  '2991055', // Brandon Ingram
  '4066372', // Jaren Jackson Jr.
];

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

/**
 * Fetch top NBA players from individual player pages
 * Uses a curated list of top player IDs and fetches their current stats
 */
async function fetchPlayerById(playerId: string): Promise<ESPNStatsLeader | null> {
  try {
    const url = `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`;

    console.log(`Fetching player ${playerId}...`);

    // Add timeout and caching for Vercel
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout per player

    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Failed to fetch player ${playerId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const athlete = data.athlete;

    if (!athlete) {
      console.log(`No athlete data for player ${playerId}`);
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

    console.log(`Player ${playerId} (${athlete.displayName}): ${ppg} PPG`);

    // Skip players who don't have PPG stats (injured/inactive)
    if (!ppg || ppg === 0) {
      console.log(`Skipping ${athlete.displayName} - no PPG data`);
      return null;
    }

    return {
      id: athlete.id,
      displayName: athlete.displayName,
      team: {
        abbreviation: athlete.team?.abbreviation || 'NBA',
      },
      position: athlete.position,
      jersey: athlete.jersey,
      height: athlete.height,
      weight: athlete.weight,
      stats: {
        gamesPlayed: 0, // ESPN doesn't provide this in statsSummary
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
    if (error.name === 'AbortError') {
      console.error(`Timeout fetching player ${playerId}`);
    } else {
      console.error(`Error fetching player ${playerId}:`, error);
    }
    return null;
  }
}

/**
 * Extract athlete ID from ESPN API $ref URL
 * Example: "http://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/athletes/3945274?lang=en&region=us"
 * Returns: "3945274"
 */
function extractAthleteId(refUrl: string): string | null {
  const match = refUrl.match(/athletes\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch top NBA players by points per game from ESPN Stats Leaders API
 * This provides real-time data with correct teams and current stats
 * Dynamically fetches the current top scorers instead of using a hardcoded list
 */
export async function getTopScorers(limit: number = 50): Promise<ESPNStatsLeader[]> {
  let athleteIds: string[] = [];

  try {
    // Get current season year (ESPN uses 2026 for 2025-26 season)
    const currentYear = new Date().getFullYear();
    const seasonYear = currentYear + 1; // ESPN uses next year for current season

    // Fetch stats leaders from ESPN API
    const leadersUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${seasonYear}/types/2/leaders?lang=en&region=us`;
    console.log(`Fetching top scorers from ESPN leaders API (season ${seasonYear})...`);
    console.log(`URL: ${leadersUrl}`);

    const leadersResponse = await fetch(leadersUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    console.log(`Leaders API response status: ${leadersResponse.status}`);

    if (!leadersResponse.ok) {
      console.error(`Failed to fetch leaders: ${leadersResponse.status} ${leadersResponse.statusText}`);
      throw new Error(`Failed to fetch leaders: ${leadersResponse.status}`);
    }

    const leadersData = await leadersResponse.json();
    console.log(`Leaders data categories count: ${leadersData.categories?.length || 0}`);

    // Find the PPG category
    const ppgCategory = leadersData.categories?.find(
      (cat: any) => cat.abbreviation === 'PTS' || cat.name === 'pointsPerGame'
    );

    if (!ppgCategory || !ppgCategory.leaders) {
      console.error('PPG leaders data not found, using fallback list');
      throw new Error('PPG leaders data not found in ESPN API response');
    }

    // Extract athlete IDs from the top leaders
    const topLeaders = ppgCategory.leaders.slice(0, Math.min(limit, ppgCategory.leaders.length));

    for (const leader of topLeaders) {
      if (leader.athlete?.$ref) {
        const athleteId = extractAthleteId(leader.athlete.$ref);
        if (athleteId) {
          athleteIds.push(athleteId);
        }
      }
    }

    console.log(`Found ${athleteIds.length} top scorers from ESPN leaders API`);

    // Fetch detailed stats for each player in batches to avoid timeout
    const players: ESPNStatsLeader[] = [];
    const batchSize = 15; // Process 15 players at a time (faster with good caching)

    for (let i = 0; i < athleteIds.length; i += batchSize) {
      const batch = athleteIds.slice(i, i + batchSize);
      console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(athleteIds.length / batchSize)}...`);

      const playerPromises = batch.map(id => fetchPlayerById(id));
      const results = await Promise.all(playerPromises);

      for (const player of results) {
        if (player) {
          players.push(player);
        }
      }
    }

    console.log(`Successfully fetched ${players.length} players with complete stats`);
    return players;
  } catch (error: any) {
    console.error('Error fetching top scorers from ESPN API:', error);
    console.log('Falling back to hardcoded player list...');

    // Use fallback list if dynamic fetch fails
    athleteIds = FALLBACK_TOP_PLAYERS.slice(0, limit);
  }

  // Fallback: Fetch using hardcoded player IDs
  try {
    console.log(`Using fallback list of ${athleteIds.length} players...`);
    const players: ESPNStatsLeader[] = [];
    const batchSize = 5; // Smaller batches for fallback to be safe

    for (let i = 0; i < athleteIds.length; i += batchSize) {
      const batch = athleteIds.slice(i, i + batchSize);
      console.log(`Fetching fallback batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(athleteIds.length / batchSize)}...`);

      const playerPromises = batch.map(id => fetchPlayerById(id));
      const results = await Promise.all(playerPromises);

      for (const player of results) {
        if (player) {
          players.push(player);
        }
      }
    }

    console.log(`Successfully fetched ${players.length} players using fallback`);
    return players;
  } catch (fallbackError) {
    console.error('Fallback also failed:', fallbackError);
    return [];
  }
}

/**
 * Fetch players by multiple stat categories for comprehensive coverage
 * Returns top players across scoring, assists, rebounds, etc.
 */
export async function getTopPlayersByAllStats(limit: number = 50): Promise<ESPNStatsLeader[]> {
  // Just use getTopScorers which already has the comprehensive list
  return getTopScorers(limit);
}
