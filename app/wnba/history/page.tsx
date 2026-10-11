import Link from 'next/link';
import type { Metadata } from 'next';
import { isKnownLeagueSeason, leagueInfo, seasonPath } from '@/lib/leagues';
import { theme } from '@/lib/theme';
import { WNBA_CHAMPIONS } from '@/lib/wnba/champions';

export const metadata: Metadata = {
  title: 'WNBA Championship History - WNBA Stats Hub',
  description: 'Every WNBA champion since 1997: Finals results, runners-up and Finals MVPs.',
  openGraph: {
    title: 'WNBA Championship History - WNBA Stats Hub',
    description: 'Every WNBA champion since 1997: Finals results, runners-up and Finals MVPs.',
  },
};

export default function WnbaHistoryPage() {
  const t = theme('wnba');
  const live = leagueInfo('wnba').liveSeason;
  const liveInProgress = live && !WNBA_CHAMPIONS.some((c) => String(c.year) === live);

  const titles = new Map<string, number>();
  for (const c of WNBA_CHAMPIONS) titles.set(c.champion, (titles.get(c.champion) ?? 0) + 1);
  const tally = [...titles.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const first = WNBA_CHAMPIONS[WNBA_CHAMPIONS.length - 1].year;
  const last = WNBA_CHAMPIONS[0].year;

  return (
    <div className={`min-h-screen ${t.pageBg}`}>
      <header className={t.headerGradient}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={seasonPath('wnba', leagueInfo('wnba').landingSeason)} className={`${t.headerSubtle} hover:text-white mb-4 inline-block`}>
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight">👑 WNBA Champions History</h1>
          <p className={`${t.headerSubtle} font-medium mt-1`}>
            {WNBA_CHAMPIONS.length} seasons of WNBA Finals history ({first}-{last})
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {liveInProgress && (
          <Link
            href={seasonPath('wnba', live)}
            className="block rounded-xl border border-orange-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-orange-700">{live} WNBA Finals</p>
            <p className="text-lg font-black text-gray-900">In progress — follow the bracket →</p>
          </Link>
        )}

        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={t.accentBar}></div>
            <h2 className="text-2xl font-black text-gray-900">All-Time Championships</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {tally.map(([team, n]) => (
              <div key={team} className="rounded-lg border border-gray-200 px-3 py-2">
                <p className="text-2xl font-black text-orange-700">{n}</p>
                <p className="text-sm font-semibold text-gray-800">{team}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 pb-3 flex items-center gap-3">
            <div className={t.accentBar}></div>
            <h2 className="text-2xl font-black text-gray-900">WNBA Finals Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-y">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2">Year</th>
                  <th className="px-4 py-2">Champion</th>
                  <th className="px-4 py-2 text-center">Series</th>
                  <th className="px-4 py-2">Runner-up</th>
                  <th className="px-4 py-2">Finals MVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {WNBA_CHAMPIONS.map((c) => {
                  const season = String(c.year);
                  const linked = isKnownLeagueSeason('wnba', season);
                  return (
                    <tr key={c.year} className="hover:bg-orange-50">
                      <td className="px-4 py-2 font-bold text-gray-900">
                        {linked ? <Link href={seasonPath('wnba', season)} className="hover:text-orange-700 underline-offset-2 hover:underline">{c.year}</Link> : c.year}
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-900">🏆 {c.champion}</td>
                      <td className="px-4 py-2 text-center tabular-nums">{c.score}</td>
                      <td className="px-4 py-2 text-gray-700">{c.runnerUp}</td>
                      <td className="px-4 py-2 text-gray-700">{c.finalsMVP}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-xs text-gray-500 border-t">
            1997 was a single championship game. Through 2015 the Finals matched the Eastern and Western Conference champions; since 2016 the playoffs have been seeded league-wide.
          </p>
        </section>
      </main>
    </div>
  );
}
