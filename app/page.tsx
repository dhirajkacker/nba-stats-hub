import { getStandings } from '@/lib/nba-api';
import LiveScores from '@/components/LiveScores';
import StandingsTable from '@/components/StandingsTable';
import ClientDate from '@/components/ClientDate';

export default async function Home() {
  // Fetch data on the server with error handling
  console.log('Home page rendering, fetching data...');

  let standings = null;

  try {
    standings = await getStandings();
    console.log('Data fetched - Standings:', standings ? `${standings.standings.length} teams` : 'null');
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                🏀 NBA Stats Hub
              </h1>
              <ClientDate />
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-orange-500 bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-400">
                <p className="text-xs text-orange-200 uppercase tracking-wide">Live Updates</p>
                <p className="text-sm font-bold">Real-time Scores</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Standings at Top - Side by Side */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900">Standings</h2>
          </div>
          {standings && standings.standings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StandingsTable standings={standings.standings} conference="East" />
              <StandingsTable standings={standings.standings} conference="West" />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-center">
                Standings data unavailable
              </p>
            </div>
          )}
        </div>

        {/* NBA Games Below */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900">
              NBA Games
            </h2>
          </div>
          <LiveScores />
        </div>

      </main>
    </div>
  );
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
