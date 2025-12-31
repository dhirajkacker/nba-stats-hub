import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getScoreboardForAPI } from '@/lib/nba-api';

export async function GET(request: NextRequest) {
  try {
    // Get date from query parameter (format: YYYY-MM-DD)
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || undefined;

    console.log('[Scores API] Fetching scoreboard for date:', date);
    const scoreboard = await getScoreboardForAPI(date);
    console.log('[Scores API] Scoreboard result:', scoreboard ? 'success' : 'null/undefined');

    if (!scoreboard) {
      console.error('[Scores API] Scoreboard is null or undefined');
      return NextResponse.json(
        { error: 'Failed to fetch scoreboard data' },
        { status: 500 }
      );
    }

    console.log('[Scores API] Returning scoreboard with', scoreboard.games?.length || 0, 'games');
    return NextResponse.json(scoreboard);
  } catch (error) {
    console.error('[Scores API] Error in scores API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Disable caching for this route to ensure fresh data
export const revalidate = 0;
