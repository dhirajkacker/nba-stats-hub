import type { Metadata } from 'next';
import { WnbaStandingsPage } from '@/views/WnbaStandingsPage';

export const metadata: Metadata = {
  title: 'WNBA Standings | WNBA Stats Hub',
  description: 'WNBA standings: league table, playoff seeds, conference records and streaks.',
};

export default async function StandingsPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  return <WnbaStandingsPage season={season} />;
}

export const dynamic = 'force-dynamic';
