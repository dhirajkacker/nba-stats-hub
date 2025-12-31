import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    console.log('[Game API] Fetching game summary for:', gameId);

    // Fetch from ESPN game summary API
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`;
    const response = await fetch(url, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error('[Game API] ESPN API failed:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch game data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Game API] Successfully fetched game data');

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Game API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const revalidate = 30; // Revalidate every 30 seconds
