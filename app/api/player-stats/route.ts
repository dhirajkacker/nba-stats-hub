import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStats } from '@/lib/nba-api';
import { CURRENT_SEASON, isKnownSeason } from '@/lib/seasons';
import { leagueFromParam } from '@/lib/leagues';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // This route reads stats.nba.com, so it only serves the NBA.
    if (leagueFromParam(searchParams.get('league')) !== 'nba') {
      return NextResponse.json({ error: 'This endpoint only supports the NBA' }, { status: 400 });
    }
    const playerIdParam = searchParams.get('playerId');
    const seasonParam = searchParams.get('season');
    const season = seasonParam && isKnownSeason(seasonParam) ? seasonParam : CURRENT_SEASON;

    if (!playerIdParam) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    const playerId = parseInt(playerIdParam);
    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    const stats = await getPlayerStats(playerId, season);

    if (!stats) {
      return NextResponse.json(
        { error: 'Player stats not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in player-stats API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
