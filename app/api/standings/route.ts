import { NextRequest, NextResponse } from 'next/server';
import { getSeasonStandings } from '@/lib/season-context';
import { CURRENT_SEASON, isKnownSeason } from '@/lib/seasons';
import { isKnownLeagueSeason, leagueFromParam, leagueInfo } from '@/lib/leagues';
import { getWnbaSeasonStandings } from '@/lib/wnba/season-context';

export async function GET(request: NextRequest) {
  try {
    const league = leagueFromParam(request.nextUrl.searchParams.get('league'));
    if (!league) {
      return NextResponse.json({ error: 'Unknown league' }, { status: 400 });
    }
    const seasonParam = request.nextUrl.searchParams.get('season');

    let standings;
    if (league === 'wnba') {
      const season = seasonParam && isKnownLeagueSeason('wnba', seasonParam) ? seasonParam : leagueInfo('wnba').landingSeason;
      standings = await getWnbaSeasonStandings(season);
    } else {
      const season = seasonParam && isKnownSeason(seasonParam) ? seasonParam : CURRENT_SEASON;
      standings = await getSeasonStandings(season);
    }

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
