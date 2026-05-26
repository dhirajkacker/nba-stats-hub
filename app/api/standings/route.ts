import { NextRequest, NextResponse } from 'next/server';
import { getSeasonStandings } from '@/lib/season-context';
import { CURRENT_SEASON, isKnownSeason } from '@/lib/seasons';

export async function GET(request: NextRequest) {
  try {
    const seasonParam = request.nextUrl.searchParams.get('season');
    const season = seasonParam && isKnownSeason(seasonParam) ? seasonParam : CURRENT_SEASON;

    const standings = await getSeasonStandings(season);

    if (!standings) {
      return NextResponse.json(
        { error: 'Failed to fetch standings data' },
        { status: 500 }
      );
    }

    return NextResponse.json(standings);
  } catch (error) {
    console.error('Error in standings API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const revalidate = 600;
