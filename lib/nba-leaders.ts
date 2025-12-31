// NBA League Leaders API - faster and more reliable than individual player stats
import { PlayerInfo } from './player-data';

const NBA_STATS_URL = 'https://stats.nba.com/stats';

const commonHeaders = {
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
};

// Cache for league leaders data
let leadersCacheData: Map<number, any> | null = null;
let leadersCacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getLeagueLeaders(): Promise<Map<number, any>> {
  // Return cached data if still valid
  if (leadersCacheData && Date.now() - leadersCacheTime < CACHE_DURATION) {
    console.log(`Using cached player stats data (${leadersCacheData.size} players)`);
    return leadersCacheData;
  }

  try {
    // Use leaguedashplayerstats to get ALL players, not just leaders
    const url = `${NBA_STATS_URL}/leaguedashplayerstats`;
    const params = new URLSearchParams({
      College: '',
      Conference: '',
      Country: '',
      DateFrom: '',
      DateTo: '',
      Division: '',
      DraftPick: '',
      DraftYear: '',
      GameScope: '',
      GameSegment: '',
      Height: '',
      LastNGames: '0',
      LeagueID: '00',
      Location: '',
      MeasureType: 'Base',
      Month: '0',
      OpponentTeamID: '0',
      Outcome: '',
      PORound: '0',
      PaceAdjust: 'N',
      PerMode: 'PerGame',
      Period: '0',
      PlayerExperience: '',
      PlayerPosition: '',
      PlusMinus: 'N',
      Rank: 'N',
      Season: '2024-25',
      SeasonSegment: '',
      SeasonType: 'Regular Season',
      ShotClockRange: '',
      StarterBench: '',
      TeamID: '0',
      TwoWay: '0',
      VsConference: '',
      VsDivision: '',
      Weight: '',
    });

    console.log('Fetching ALL NBA player stats from NBA.com...');

    const response = await fetch(`${url}?${params}`, {
      headers: commonHeaders,
      signal: AbortSignal.timeout(15000), // 15 second timeout for larger dataset
    });

    if (!response.ok) {
      console.error('Failed to fetch player stats:', response.status);
      return leadersCacheData || new Map();
    }

    const data = await response.json();

    if (data.resultSets?.[0]?.headers && data.resultSets?.[0]?.rowSet) {
      const headers = data.resultSets[0].headers;
      const rows = data.resultSets[0].rowSet;

      // Map player ID to stats object
      const playersMap = new Map<number, any>();

      rows.forEach((row: any[]) => {
        const playerData: any = {};
        headers.forEach((header: string, index: number) => {
          playerData[header] = row[index];
        });
        playersMap.set(playerData.PLAYER_ID, playerData);
      });

      console.log(`✓ Fetched stats for ${playersMap.size} NBA players`);

      // Update cache
      leadersCacheData = playersMap;
      leadersCacheTime = Date.now();

      return playersMap;
    }

    return leadersCacheData || new Map();
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return leadersCacheData || new Map();
  }
}

export async function getPlayerStatsFromLeaders(playerId: number): Promise<Partial<PlayerInfo> | null> {
  const leaders = await getLeagueLeaders();
  const playerData = leaders.get(playerId);

  if (!playerData) {
    console.log(`Player ${playerId} not found in league leaders`);
    return null;
  }

  return {
    ppg: playerData.PTS,
    rpg: playerData.REB,
    apg: playerData.AST,
    fgPct: playerData.FG_PCT * 100,
    fg3Pct: playerData.FG3_PCT * 100,
    ftPct: playerData.FT_PCT * 100,
    fgm: playerData.FGM,
    fga: playerData.FGA,
    fg3m: playerData.FG3M,
    fg3a: playerData.FG3A,
    ftm: playerData.FTM,
    fta: playerData.FTA,
    mpg: playerData.MIN,
  };
}
