import { NextRequest, NextResponse } from 'next/server';
import { getSeasonStandings } from '@/lib/season-context';
import { CURRENT_SEASON, isKnownSeason } from '@/lib/seasons';
import { leagueFromParam } from '@/lib/leagues';

export async function GET(request: NextRequest) {
  try {
    const league = leagueFromParam(request.nextUrl.searchParams.get('league'));
    if (league !== 'nba') {
      // WNBA data arrives in a later step; unknown leagues are rejected.
      return NextResponse.json({ error: league ? 'League not supported yet' : 'Unknown league' }, { status: league ? 501 : 400 });
    }
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
