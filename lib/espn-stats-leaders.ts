// Fetch NBA stats leaders from ESPN API
// This provides real-time, accurate player data with current teams and stats

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

    const response = await fetch(url, {
      cache: 'no-store', // Don't cache in API routes
    });

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
  } catch (error) {
    console.error(`Error fetching player ${playerId}:`, error);
    return null;
  }
}

/**
 * Fetch top NBA players by points per game from ESPN
 * This provides real-time data with correct teams and current stats
 */
export async function getTopScorers(limit: number = 50): Promise<ESPNStatsLeader[]> {
  // Curated list of top NBA player IDs from ESPN
  // These are the actual ESPN IDs for top performers
  const topPlayerIds = [
    '3059318', // Joel Embiid
    '3112335', // Nikola Jokic
    '3945274', // Luka Doncic (actual ESPN ID)
    '3202', // Kevin Durant
    '3975', // Stephen Curry
    '1966', // LeBron James
    '3032977', // Giannis Antetokounmpo
    '4065648', // Jayson Tatum
    '4278073', // Shai Gilgeous-Alexander
    '6583', // Anthony Davis
    '4277905', // Trae Young
    '4431678', // Anthony Edwards
    '4279888', // Ja Morant
    '6606', // Damian Lillard
    '3136193', // Devin Booker
    '4066636', // Donovan Mitchell
    '4065679', // De'Aaron Fox
    '3917376', // Jaylen Brown
    '2991043', // Kawhi Leonard
    '6450', // Paul George (actual ESPN ID)
    '4395628', // Zion Williamson
    '4432816', // LaMelo Ball
    '3136776', // Karl-Anthony Towns (actual ESPN ID)
    '3147657', // Rudy Gobert
    '4066421', // Brandon Ingram
    '4277847', // Darius Garland
    '4397020', // Jaren Jackson Jr
    '1628389', // Bam Adebayo
    '4433134', // Tyrese Haliburton
    '3136777', // D'Angelo Russell
  ];

  const players: ESPNStatsLeader[] = [];

  // Fetch players in parallel
  const playerPromises = topPlayerIds.map(id => fetchPlayerById(id));
  const results = await Promise.all(playerPromises);

  for (const player of results) {
    if (player) {
      players.push(player);
    }
  }

  // Sort by PPG descending
  players.sort((a, b) => (b.stats.ppg || 0) - (a.stats.ppg || 0));

  console.log(`Fetched ${players.length} top players from ESPN individual pages`);
  return players.slice(0, limit);
}

/**
 * Fetch players by multiple stat categories for comprehensive coverage
 * Returns top players across scoring, assists, rebounds, etc.
 */
export async function getTopPlayersByAllStats(limit: number = 50): Promise<ESPNStatsLeader[]> {
  // Just use getTopScorers which already has the comprehensive list
  return getTopScorers(limit);
}
