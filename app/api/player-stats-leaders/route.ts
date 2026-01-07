import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStatsFromLeaders } from '@/lib/nba-leaders';
import { getTopPlayersByAllStats, getLastFetchStatus } from '@/lib/espn-stats-leaders';

// Increase timeout for Vercel serverless function
export const maxDuration = 30;
// Cache the response for 1 hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerIdParam = searchParams.get('playerId');
    const limitParam = searchParams.get('limit');
    const includeStatus = searchParams.get('includeStatus') === 'true';

    // If no playerId specified, return top players list
    if (!playerIdParam) {
      const limit = limitParam ? parseInt(limitParam) : 30;
      console.log(`API: Fetching top ${limit} players...`);

      const startTime = Date.now();
      const topPlayers = await getTopPlayersByAllStats(limit);
      const fetchTime = Date.now() - startTime;

      const status = getLastFetchStatus();
      console.log(`API: Fetched ${topPlayers.length} players from ${status.source} in ${fetchTime}ms`);

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
