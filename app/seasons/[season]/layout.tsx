import { notFound } from 'next/navigation';
import { isKnownSeason } from '@/lib/seasons';
import SeasonNav from '@/components/SeasonNav';
import { SeasonProvider } from '@/components/SeasonProvider';

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
    <SeasonProvider season={season}>
      <SeasonNav currentSeason={season} />
      {children}
    </SeasonProvider>
  );
}
