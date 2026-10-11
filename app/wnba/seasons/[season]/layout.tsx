import { notFound } from 'next/navigation';
import { isKnownLeagueSeason } from '@/lib/leagues';
import SeasonNav from '@/components/SeasonNav';
import { SeasonProvider } from '@/components/SeasonProvider';

export default async function WnbaSeasonLayout({
  params,
  children,
}: {
  params: Promise<{ season: string }>;
  children: React.ReactNode;
}) {
  const { season } = await params;
  if (!isKnownLeagueSeason('wnba', season)) {
    notFound();
  }

  return (
    <SeasonProvider season={season}>
      <SeasonNav league="wnba" currentSeason={season} />
      {children}
    </SeasonProvider>
  );
}
