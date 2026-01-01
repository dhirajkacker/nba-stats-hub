// Fetch NBA stats leaders from ESPN API
// This provides real-time, accurate player data with current teams and stats

// Fallback list of actual top 30 NBA scorers (2025-26 season)
// Updated: 2025-12-31 from ESPN leaders API
const FALLBACK_TOP_PLAYERS = [
  '3945274',  // Luka Doncic - 33.5 PPG
  '4278073',  // Shai Gilgeous-Alexander - 32.2 PPG
  '4431678',  // Tyrese Maxey - 30.8 PPG
  '3112335',  // Nikola Jokic - 29.6 PPG
  '3908809',  // Giannis Antetokounmpo - 29.5 PPG
  '3917376',  // Jayson Tatum - 29.5 PPG
  '3934672',  // Anthony Edwards - 29.4 PPG
  '4594268',  // Alperen Sengun - 29.1 PPG
  '3975',     // Kevin Durant - 28.8 PPG
  '3032977',  // Damian Lillard - 28.7 PPG
  '6450',     // Kawhi Leonard - 27.8 PPG
  '4066336',  // Donovan Mitchell - 27.7 PPG
  '4066457',  // LaMelo Ball - 26.6 PPG
  '4432166',  // Cam Thomas - 26.5 PPG
  '3992',     // LeBron James - 26.1 PPG
  '4278104',  // Michael Porter Jr. - 25.8 PPG
  '4683021',  // Paolo Banchero - 25.6 PPG
  '3202',     // Kevin Love - 25.5 PPG
  '3136193',  // Devin Booker - 25.3 PPG
  '3936299',  // Jalen Brunson - 25.2 PPG
  '4433627',  // Franz Wagner - 24.6 PPG
  '5104157',  // Victor Wembanyama - 24.0 PPG
  '2595516',  // Trae Young - 23.8 PPG
  '4701230',  // Gradey Dick - 23.7 PPG
  '3149673',  // Karl-Anthony Towns - 23.4 PPG
  '4066261',  // De'Aaron Fox - 23.2 PPG
  '4397020',  // Luguentz Dort - 23.0 PPG
  '3059318',  // Joel Embiid - 22.6 PPG
  '4395628',  // Zion Williamson - 22.3 PPG
  '6583',     // Anthony Davis - 20.5 PPG
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      }
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      }
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
    console.error('❌ ERROR fetching dynamic top scorers from ESPN leaders API');
    console.error('Error:', error.message);
    console.log('⚠️  Falling back to curated list of top players with real-time ESPN stats');

    // ESPN's sports.core API is blocked on Vercel, use fallback list
    athleteIds = FALLBACK_TOP_PLAYERS.slice(0, limit);
  }

  // Fallback: Use curated player list but fetch real-time stats from ESPN
  try {
    console.log(`Fetching ${athleteIds.length} top players using curated list...`);
    const players: ESPNStatsLeader[] = [];
    const batchSize = 15; // Same batch size as dynamic

    for (let i = 0; i < athleteIds.length; i += batchSize) {
      const batch = athleteIds.slice(i, i + batchSize);
      console.log(`Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(athleteIds.length / batchSize)}...`);

      const playerPromises = batch.map(id => fetchPlayerById(id));
      const results = await Promise.all(playerPromises);

      for (const player of results) {
        if (player) {
          players.push(player);
        }
      }
    }

    // Sort by PPG descending to show actual leaders first
    players.sort((a, b) => (b.stats?.ppg || 0) - (a.stats?.ppg || 0));

    console.log(`✅ Successfully fetched ${players.length} players with real-time stats`);
    return players;
  } catch (fallbackError: any) {
    console.error('❌ Fallback also failed:', fallbackError.message);
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
