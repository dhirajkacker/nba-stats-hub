import { NextResponse } from 'next/server';
import { getStandings } from '@/lib/nba-api';

export async function GET() {
  try {
    const standings = await getStandings();

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

// Revalidate every 10 minutes
export const revalidate = 600;
