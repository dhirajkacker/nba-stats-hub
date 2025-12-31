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
 * Fetch top NBA players by points per game from ESPN
 * This provides real-time data with correct teams and current stats
 */
export async function getTopScorers(limit: number = 50): Promise<ESPNStatsLeader[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/statistics?limit=${limit}`;

    console.log('Fetching top scorers from ESPN:', url);

    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch stats leaders:', response.status);
      return [];
    }

    const data = await response.json();

    // ESPN returns leaders in categories
    const leaders = data.leaders || [];
    const scoringLeaders = leaders.find((category: any) =>
      category.name === 'points' || category.displayName === 'Points'
    );

    if (!scoringLeaders?.athletes) {
      console.log('No scoring leaders found');
      return [];
    }

    const players: ESPNStatsLeader[] = [];

    for (const athleteData of scoringLeaders.athletes.slice(0, limit)) {
      const athlete = athleteData.athlete;
      const stats = athleteData.statistics;

      // Helper to get stat value
      const getStat = (name: string): number => {
        const stat = stats?.find((s: any) => s.name === name);
        const value = stat?.value || stat?.displayValue;
        if (value === undefined || value === null) return 0;
        return typeof value === 'string' ? parseFloat(value) : value;
      };

      players.push({
        id: athlete.id,
        displayName: athlete.displayName || athlete.name,
        team: {
          abbreviation: athlete.team?.abbreviation || 'NBA',
        },
        position: athlete.position,
        jersey: athlete.jersey,
        height: athlete.height,
        weight: athlete.weight,
        stats: {
          gamesPlayed: getStat('gamesPlayed'),
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
      });
    }

    console.log(`Fetched ${players.length} top scorers from ESPN`);
    return players;
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return [];
  }
}

/**
 * Fetch players by multiple stat categories for comprehensive coverage
 * Returns top players across scoring, assists, rebounds, etc.
 */
export async function getTopPlayersByAllStats(limit: number = 30): Promise<ESPNStatsLeader[]> {
  try {
    const categories = ['points', 'assists', 'rebounds'];
    const allPlayersMap = new Map<string, ESPNStatsLeader>();

    for (const category of categories) {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/statistics?limit=${limit}&category=${category}`;

      const response = await fetch(url, {
        next: { revalidate: 1800 },
      });

      if (!response.ok) continue;

      const data = await response.json();
      const leaders = data.leaders || [];
      const categoryLeaders = leaders[0];

      if (!categoryLeaders?.athletes) continue;

      for (const athleteData of categoryLeaders.athletes.slice(0, limit)) {
        const athlete = athleteData.athlete;

        // Skip if already added
        if (allPlayersMap.has(athlete.id)) continue;

        const stats = athleteData.statistics || [];
        const getStat = (name: string): number => {
          const stat = stats.find((s: any) => s.name === name);
          const value = stat?.value || stat?.displayValue;
          if (value === undefined || value === null) return 0;
          return typeof value === 'string' ? parseFloat(value) : value;
        };

        allPlayersMap.set(athlete.id, {
          id: athlete.id,
          displayName: athlete.displayName || athlete.name,
          team: {
            abbreviation: athlete.team?.abbreviation || 'NBA',
          },
          position: athlete.position,
          jersey: athlete.jersey,
          height: athlete.height,
          weight: athlete.weight,
          stats: {
            gamesPlayed: getStat('gamesPlayed'),
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
        });
      }
    }

    const players = Array.from(allPlayersMap.values());

    // Sort by PPG descending
    players.sort((a, b) => (b.stats.ppg || 0) - (a.stats.ppg || 0));

    console.log(`Fetched ${players.length} unique players across all stat categories`);
    return players;
  } catch (error) {
    console.error('Error fetching players by all stats:', error);
    return [];
  }
}
