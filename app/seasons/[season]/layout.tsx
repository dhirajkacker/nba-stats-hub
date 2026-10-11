import { notFound } from 'next/navigation';
import { isKnownSeason } from '@/lib/seasons';
import SeasonNav from '@/components/SeasonNav';
import { SeasonProvider } from '@/components/SeasonProvider';
import { LeagueProvider } from '@/components/LeagueProvider';

export default async function SeasonLayout({
  params,
  children,
}: {
  params: Promise<{ season: string }>;
  children: React.ReactNode;
}) {
  const { season } = await params;
  if (!isKnownSeason(season)) {
    notFound();
  }

  return (
    <LeagueProvider league="nba">
      <SeasonProvider season={season}>
        <SeasonNav league="nba" currentSeason={season} />
        {children}
      </SeasonProvider>
    </LeagueProvider>
  );
}
