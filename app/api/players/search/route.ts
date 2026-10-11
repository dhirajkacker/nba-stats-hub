import { NextResponse } from 'next/server';
import { searchAllPlayers } from '@/lib/espn-players';
import { leagueFromParam } from '@/lib/leagues';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const league = leagueFromParam(searchParams.get('league'));
    if (!league) {
      return NextResponse.json({ error: 'Unknown league' }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const players = await searchAllPlayers(league, query);

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error in player search API:', error);
    return NextResponse.json(
      { error: 'Failed to search players' },
      { status: 500 }
    );
  }
}

export const revalidate = 3600; // Cache for 1 hour
