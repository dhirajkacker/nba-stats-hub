import { getESPNStandings, getESPNStandingsBySeason } from '@/lib/espn-api';
import StandingsTable from '@/components/StandingsTable';
import Link from 'next/link';

export default async function StandingsPage() {
  // Fetch current season and past seasons standings
  const [currentStandings, lastSeasonStandings, season2023Standings] = await Promise.all([
    getESPNStandings(),
    getESPNStandingsBySeason('2024-04-14'), // End of 2023-24 regular season
    getESPNStandingsBySeason('2023-04-09')  // End of 2022-23 regular season
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-black tracking-tight mb-2">
            🏆 NBA Standings
          </h1>
          <p className="text-orange-200 font-medium">
            Current season standings and historical results
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Current Season Standings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900">
              {currentStandings?.season || '2024-25'} Season - Current Standings
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Eastern Conference */}
            {currentStandings && currentStandings.standings ? (
              <StandingsTable standings={currentStandings.standings} conference="East" />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">Eastern Conference standings unavailable</p>
              </div>
            )}

            {/* Western Conference */}
            {currentStandings && currentStandings.standings ? (
              <StandingsTable standings={currentStandings.standings} conference="West" />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">Western Conference standings unavailable</p>
              </div>
            )}
          </div>
        </section>

        {/* 2023-24 Season Final Standings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900">
              {lastSeasonStandings?.season || '2023-24'} Season - Final Standings
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Eastern Conference */}
            {lastSeasonStandings && lastSeasonStandings.standings ? (
              <StandingsTable standings={lastSeasonStandings.standings} conference="East" />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">2023-24 Eastern Conference standings unavailable</p>
              </div>
            )}

            {/* Western Conference */}
            {lastSeasonStandings && lastSeasonStandings.standings ? (
              <StandingsTable standings={lastSeasonStandings.standings} conference="West" />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">2023-24 Western Conference standings unavailable</p>
              </div>
            )}
          </div>
        </section>

        {/* 2022-23 Season Final Standings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900">
              {season2023Standings?.season || '2022-23'} Season - Final Standings
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Eastern Conference */}
            {season2023Standings && season2023Standings.standings ? (
              <StandingsTable standings={season2023Standings.standings} conference="East" />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">2022-23 Eastern Conference standings unavailable</p>
              </div>
            )}

            {/* Western Conference */}
            {season2023Standings && season2023Standings.standings ? (
              <StandingsTable standings={season2023Standings.standings} conference="West" />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">2022-23 Western Conference standings unavailable</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
