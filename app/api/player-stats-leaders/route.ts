import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStatsFromLeaders } from '@/lib/nba-leaders';
import { getLastFetchStatus } from '@/lib/espn-stats-leaders';
import { getSeasonLeaders } from '@/lib/season-context';
import { CURRENT_SEASON, isKnownSeason } from '@/lib/seasons';
import { isKnownLeagueSeason, leagueFromParam, leagueInfo } from '@/lib/leagues';
import { getWnbaSeasonLeaders } from '@/lib/wnba/season-context';

// Increase timeout for Vercel serverless function
export const maxDuration = 30;
// Cache the response for 1 hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const league = leagueFromParam(request.nextUrl.searchParams.get('league'));
    if (!league) {
      return NextResponse.json({ error: 'Unknown league' }, { status: 400 });
    }
    if (league === 'wnba') {
      return wnbaLeaders(request);
    }
    const playerIdParam = searchParams.get('playerId');
    const limitParam = searchParams.get('limit');
    const includeStatus = searchParams.get('includeStatus') === 'true';
    const seasonParam = searchParams.get('season');
    const season = seasonParam && isKnownSeason(seasonParam) ? seasonParam : CURRENT_SEASON;

    // If no playerId specified, return top players list
    if (!playerIdParam) {
      const limit = limitParam ? parseInt(limitParam) : 30;
      console.log(`API: Fetching top ${limit} players for season ${season}...`);

      const startTime = Date.now();
      const topPlayers = await getSeasonLeaders(season, limit);
      const fetchTime = Date.now() - startTime;

      const status = getLastFetchStatus();
      console.log(`API: Fetched ${topPlayers.length} players from ${status.source} in ${fetchTime}ms`);

      // The season exists but ESPN has no leaders yet (before opening night).
      // That's an expected empty state, not an outage.
      if (topPlayers.length === 0 && status.seasonUnavailable) {
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
            'X-Season-Status': 'not-started',
          },
        });
      }

      if (topPlayers.length === 0) {
        console.error('API: No players returned - all data sources failed');
        console.error('API: Errors:', status.errors);
        return NextResponse.json(
          {
            error: 'Unable to fetch player data',
            errors: status.errors,
            message: 'All ESPN data sources are currently unavailable. Please try again later.',
          },
          { status: 503 }
        );
      }

      // Return with metadata if requested
      if (includeStatus) {
        return NextResponse.json({
          players: topPlayers,
          meta: {
            source: status.source,
            count: topPlayers.length,
            fetchTimeMs: fetchTime,
            errors: status.errors.length > 0 ? status.errors : undefined,
          },
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        });
      }

      // Always return an array, even if empty
      return NextResponse.json(topPlayers, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    // If playerId specified, return that specific player's stats
    const playerId = parseInt(playerIdParam);
    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    const stats = await getPlayerStatsFromLeaders(playerId);

    if (!stats) {
      return NextResponse.json(
        { error: 'Player stats not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('❌ API Route Error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to fetch player stats',
        message: error.message,
        name: error.name
      },
      { status: 500 }
    );
  }
}

// WNBA leaders list. Each leader carries the team id and logo for the season
// (WNBA team links and logos need both) and the headshot ESPN provides.
async function wnbaLeaders(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.get('playerId')) {
    return NextResponse.json({ error: 'playerId lookups are NBA only' }, { status: 400 });
  }
  const seasonParam = params.get('season');
  const season = seasonParam && isKnownLeagueSeason('wnba', seasonParam) ? seasonParam : leagueInfo('wnba').landingSeason;
  const limit = Math.min(parseInt(params.get('limit') ?? '25', 10) || 25, 50);
  const { leaders, seasonUnavailable } = await getWnbaSeasonLeaders(season, limit);
  if (leaders.length === 0 && !seasonUnavailable) {
    return NextResponse.json(
      { error: 'Unable to fetch player data', message: 'ESPN data is currently unavailable. Please try again later.' },
      { status: 503 },
    );
  }
  return NextResponse.json(leaders, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      ...(seasonUnavailable ? { 'X-Season-Status': 'not-started' } : {}),
    },
  });
}
