import { NextResponse } from 'next/server';
import { searchAllPlayers } from '@/lib/espn-players';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const players = await searchAllPlayers(query);

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
