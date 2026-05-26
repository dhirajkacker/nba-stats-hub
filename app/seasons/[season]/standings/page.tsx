import StandingsTable from '@/components/StandingsTable';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getSeasonStandings, getSeasonMeta } from '@/lib/season-context';
import { seasonLabel } from '@/lib/seasons';

export const metadata: Metadata = {
  title: 'NBA Standings - NBA Stats Hub',
  description: 'NBA standings for Eastern and Western conferences. Track team records, win percentages, and playoff seedings.',
  openGraph: {
    title: 'NBA Standings - NBA Stats Hub',
    description: 'NBA standings for Eastern and Western conferences. Track team records, win percentages, and playoff seedings.',
  },
};

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const [standings, meta] = await Promise.all([
    getSeasonStandings(season),
    getSeasonMeta(season),
  ]);

  const heading = `${seasonLabel(season)} - ${meta.frozen ? 'Final Standings' : 'Current Standings'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={`/seasons/${season}`} className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-black tracking-tight mb-2">
            🏆 NBA Standings
          </h1>
          <p className="text-orange-200 font-medium">
            {heading}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900">{heading}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {standings && standings.standings.length > 0 ? (
              <>
                <StandingsTable standings={standings.standings} conference="East" season={season} />
                <StandingsTable standings={standings.standings} conference="West" season={season} />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <p className="text-gray-500 text-center">Standings data unavailable</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
