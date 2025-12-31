import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStatsFromLeaders } from '@/lib/nba-leaders';
import { getTopPlayersByAllStats } from '@/lib/espn-stats-leaders';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerIdParam = searchParams.get('playerId');
    const limitParam = searchParams.get('limit');

    // If no playerId specified, return top players list
    if (!playerIdParam) {
      const limit = limitParam ? parseInt(limitParam) : 50;
      const topPlayers = await getTopPlayersByAllStats(limit);
      return NextResponse.json(topPlayers);
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
  } catch (error) {
    console.error('Error in player-stats-leaders API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
