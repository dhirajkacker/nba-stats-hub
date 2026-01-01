import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStatsFromLeaders } from '@/lib/nba-leaders';
import { getTopPlayersByAllStats } from '@/lib/espn-stats-leaders';

// Increase timeout for Vercel serverless function (max on hobby plan is 10s, but we can try)
export const maxDuration = 10;
// Cache the response for 1 hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerIdParam = searchParams.get('playerId');
    const limitParam = searchParams.get('limit');

    // If no playerId specified, return top players list
    if (!playerIdParam) {
      const limit = limitParam ? parseInt(limitParam) : 50;
      console.log(`API: Fetching top ${limit} players...`);

      const topPlayers = await getTopPlayersByAllStats(limit);
      console.log(`API: Successfully fetched ${topPlayers.length} players`);

      if (topPlayers.length === 0) {
        console.error('API: No players returned from getTopPlayersByAllStats');
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
    console.error('Error in player-stats-leaders API route:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch player stats', message: error.message },
      { status: 500 }
    );
  }
}
