import { getPlayerDetails, getPlayerStats, getPlayerGameLog } from '@/lib/espn-players';
import { getTeamLogoUrl, getTeamColor } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PlayerPageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerId } = await params;

  console.log(`Player page loading for ID: ${playerId}`);

  // Fetch player data from ESPN (always use real-time data)
  const [player, stats, gameLogs] = await Promise.all([
    getPlayerDetails(playerId),
    getPlayerStats(playerId),
    getPlayerGameLog(playerId, 10)
  ]);

  // If player details not found, show 404
  if (!player) {
    console.log(`Player not found for ID: ${playerId}, showing 404 page`);
    notFound();
  }

  console.log(`Player page loaded for: ${player.displayName}`);

  const teamAbbr = player.team?.abbreviation || 'NBA';
  const teamColor = getTeamColor(teamAbbr);

  // Extract current season stats from statsSummary or use POPULAR_PLAYERS data
  const currentSeasonStats = stats?.statistics || [];

  // Log available stats for debugging
  console.log(`Available stats for ${player.displayName}:`, currentSeasonStats.map((s: any) => s.name).join(', '));

  // Helper function to get stat value from ESPN API (always use real-time data)
  const getStatValue = (name: string) => {
    const stat = currentSeasonStats.find((s: any) => s.name === name);
    const value = stat?.displayValue || stat?.value;
    if (!value) {
      console.log(`Stat ${name}: not available`);
      return null;
    }
    console.log(`Stat ${name}: ${value}`);

    // Format numeric values to 1 decimal place
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue === 'number' && !isNaN(numValue)) {
      return numValue.toFixed(1);
    }

    return value;
  };

  // Career stats - for now use the same as current season
  // ESPN API doesn't provide career stats in a simple endpoint
  const getCareerStat = (name: string) => {
    return getStatValue(name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header with team colors */}
      <header
        className="text-white shadow-2xl border-b-4"
        style={{
          background: `linear-gradient(to right, ${teamColor}, #1a1a1a)`,
          borderBottomColor: teamColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/players" className="text-gray-200 hover:text-white mb-4 inline-block">
            ← Back to Players
          </Link>
          <div className="flex items-center gap-6">
            {player.headshot?.href ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <Image
                  src={player.headshot.href}
                  alt={player.displayName}
                  width={96}
                  height={96}
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-8xl">👤</div>
            )}
            <div>
              <h1 className="text-5xl font-black tracking-tight mb-2">
                {player.displayName}
              </h1>
              <div className="flex items-center gap-4 text-xl">
                {player.jersey && <span className="font-bold">#{player.jersey}</span>}
                {player.jersey && <span className="text-gray-300">•</span>}
                <span>{player.position?.abbreviation || 'N/A'}</span>
                {player.team?.abbreviation && (
                  <>
                    <span className="text-gray-300">•</span>
                    <Link
                      href={`/teams/${teamAbbr.toLowerCase()}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="relative w-8 h-8">
                        <Image
                          src={getTeamLogoUrl(teamAbbr, 'small')}
                          alt={`${teamAbbr} logo`}
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="hover:underline">{teamAbbr}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Bio Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4" style={{ borderLeftColor: teamColor }}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Height</p>
            <p className="text-2xl font-black text-gray-900">{player.height || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-orange-500">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Weight</p>
            <p className="text-2xl font-black text-gray-900">{player.weight ? `${player.weight} lbs` : 'N/A'}</p>
          </div>
          {player.age && (
            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-indigo-500">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Age</p>
              <p className="text-2xl font-black text-gray-900">{player.age}</p>
            </div>
          )}
          {player.birthPlace?.city && (
            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-teal-500 col-span-2 md:col-span-1 lg:col-span-2">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">From</p>
              <p className="text-lg font-black text-gray-900 truncate">{player.birthPlace.city}, {player.birthPlace.country}</p>
            </div>
          )}
          {player.experience?.years !== undefined && (
            <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-pink-500">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Experience</p>
              <p className="text-2xl font-black text-gray-900">{player.experience.years} yrs</p>
            </div>
          )}
        </div>

        {/* Season Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-900">2025-26 Season Stats</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Primary Stats - Larger */}
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">PPG</p>
              <p className="text-3xl font-black text-blue-900">{getStatValue('avgPoints') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm">
              <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">RPG</p>
              <p className="text-3xl font-black text-green-900">{getStatValue('avgRebounds') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm">
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">APG</p>
              <p className="text-3xl font-black text-purple-900">{getStatValue('avgAssists') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm">
              <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">FG%</p>
              <p className="text-3xl font-black text-red-900">{getStatValue('fieldGoalPct') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm">
              <p className="text-xs text-yellow-600 font-bold uppercase tracking-wide mb-1">3P%</p>
              <p className="text-3xl font-black text-yellow-900">{getStatValue('threePointFieldGoalPct') || getStatValue('threePointPct') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm">
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-1">FT%</p>
              <p className="text-3xl font-black text-orange-900">{getStatValue('freeThrowPct') || '-'}</p>
            </div>

            {/* Secondary Stats */}
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm">
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide mb-1">SPG</p>
              <p className="text-3xl font-black text-indigo-900">{getStatValue('avgSteals') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl shadow-sm">
              <p className="text-xs text-pink-600 font-bold uppercase tracking-wide mb-1">BPG</p>
              <p className="text-3xl font-black text-pink-900">{getStatValue('avgBlocks') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-sm">
              <p className="text-xs text-teal-600 font-bold uppercase tracking-wide mb-1">MPG</p>
              <p className="text-3xl font-black text-teal-900">{getStatValue('avgMinutes') || '-'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-sm">
              <p className="text-xs text-cyan-600 font-bold uppercase tracking-wide mb-1">TOV</p>
              <p className="text-3xl font-black text-cyan-900">{getStatValue('avgTurnovers') || '-'}</p>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        {gameLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900">Recent Games</h2>
            </div>

            <div className="space-y-4">
              {gameLogs.map((game: any, index: number) => {
                const gameDate = new Date(game.gameDate);
                const opponent = game.opponent?.abbreviation || 'N/A';
                const opponentName = game.opponent?.displayName || opponent;
                const won = game.gameResult === 'W';
                const stats = game.playerStats || {};

                return (
                  <div key={index} className={`rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                    won ? 'bg-gradient-to-r from-green-50 to-white border-green-200' : 'bg-gradient-to-r from-red-50 to-white border-red-200'
                  }`}>
                    {/* Game Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
                          won ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {game.gameResult || '-'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="font-bold text-gray-900">
                            {game.atVs} {opponentName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-gray-900">
                          {game.score || '-'}
                        </p>
                        <p className="text-xs text-gray-500">Final</p>
                      </div>
                    </div>

                    {/* Player Stats for this game */}
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="grid grid-cols-5 md:grid-cols-9 gap-2 text-center">
                        {/* Primary Stats */}
                        <div className="bg-blue-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-blue-600 uppercase">PTS</p>
                          <p className="text-lg font-black text-blue-900">{stats.pts}</p>
                        </div>
                        <div className="bg-green-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-green-600 uppercase">REB</p>
                          <p className="text-lg font-black text-green-900">{stats.reb}</p>
                        </div>
                        <div className="bg-purple-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-purple-600 uppercase">AST</p>
                          <p className="text-lg font-black text-purple-900">{stats.ast}</p>
                        </div>
                        <div className="bg-indigo-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase">STL</p>
                          <p className="text-lg font-black text-indigo-900">{stats.stl}</p>
                        </div>
                        <div className="bg-pink-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-pink-600 uppercase">BLK</p>
                          <p className="text-lg font-black text-pink-900">{stats.blk}</p>
                        </div>
                        {/* Secondary Stats - Hidden on mobile */}
                        <div className="hidden md:block bg-teal-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-teal-600 uppercase">MIN</p>
                          <p className="text-lg font-black text-teal-900">{stats.min}</p>
                        </div>
                        <div className="hidden md:block bg-orange-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-orange-600 uppercase">FG%</p>
                          <p className="text-lg font-black text-orange-900">{stats.fgPct}</p>
                        </div>
                        <div className="hidden md:block bg-yellow-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-yellow-600 uppercase">3P%</p>
                          <p className="text-lg font-black text-yellow-900">{stats.fg3Pct}</p>
                        </div>
                        <div className="hidden md:block bg-cyan-100 rounded-lg py-2 px-1">
                          <p className="text-[10px] font-bold text-cyan-600 uppercase">TO</p>
                          <p className="text-lg font-black text-cyan-900">{stats.to}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
