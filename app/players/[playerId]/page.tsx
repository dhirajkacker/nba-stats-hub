import { getPlayerDetails, getPlayerStats, getPlayerGameLog } from '@/lib/espn-players';
import { getTeamLogoUrl, getTeamColor } from '@/lib/team-logos';
import { POPULAR_PLAYERS, PlayerInfo } from '@/lib/player-data';
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

  // Check if player is in POPULAR_PLAYERS (has complete stats)
  const popularPlayer = POPULAR_PLAYERS.find(p => p.id === parseInt(playerId));

  // Fetch player data from ESPN
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

  // Helper function to get stat value (prefers POPULAR_PLAYERS data, falls back to ESPN)
  const getStatValue = (name: string, popularKey?: keyof PlayerInfo) => {
    // First try to get from popular players (has complete stats)
    if (popularPlayer && popularKey && popularPlayer[popularKey] !== undefined) {
      const value = popularPlayer[popularKey];
      if (typeof value === 'number') {
        return value.toFixed(1);
      }
      return value as string;
    }

    // Fall back to ESPN API
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
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8">
                        <Image
                          src={getTeamLogoUrl(teamAbbr, 'small')}
                          alt={`${teamAbbr} logo`}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                      <span>{teamAbbr}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: teamColor }}>
            <p className="text-gray-600 text-sm font-medium mb-1">Height</p>
            <p className="text-2xl font-black text-gray-900">{popularPlayer?.height || player.height || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Weight</p>
            <p className="text-2xl font-black text-gray-900">{popularPlayer?.weight ? `${popularPlayer.weight} lbs` : player.weight ? `${player.weight} lbs` : 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium mb-1">PPG</p>
            <p className="text-2xl font-black text-gray-900">{getStatValue('avgPoints', 'ppg') || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium mb-1">RPG</p>
            <p className="text-2xl font-black text-gray-900">{getStatValue('avgRebounds', 'rpg') || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium mb-1">APG</p>
            <p className="text-2xl font-black text-gray-900">{getStatValue('avgAssists', 'apg') || 'N/A'}</p>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-900">Player Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Full Name</span>
                <span className="font-bold text-gray-900">{player.displayName}</span>
              </div>
              {player.jersey && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Jersey Number</span>
                  <span className="font-bold text-gray-900">#{player.jersey}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Position</span>
                <span className="font-bold text-gray-900">{player.position?.abbreviation || 'N/A'}</span>
              </div>
              {player.birthPlace?.city && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Birthplace</span>
                  <span className="font-bold text-gray-900">{player.birthPlace.city}, {player.birthPlace.country}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Height</span>
                <span className="font-bold text-gray-900">{popularPlayer?.height || player.height || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Weight</span>
                <span className="font-bold text-gray-900">{popularPlayer?.weight ? `${popularPlayer.weight} lbs` : player.weight ? `${player.weight} lbs` : 'N/A'}</span>
              </div>
              {player.team?.abbreviation && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Team</span>
                  <Link
                    href={`/teams/${teamAbbr.toLowerCase()}`}
                    className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-2"
                  >
                    <div className="relative w-6 h-6">
                      <Image
                        src={getTeamLogoUrl(teamAbbr, 'small')}
                        alt={`${teamAbbr} logo`}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                    {teamAbbr}
                  </Link>
                </div>
              )}
              {player.age && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Age</span>
                  <span className="font-bold text-gray-900">{player.age}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Season Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-900">2024-25 Season Stats</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">PPG</p>
              <p className="text-3xl font-black text-blue-900">{getStatValue('avgPoints', 'ppg') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">RPG</p>
              <p className="text-3xl font-black text-green-900">{getStatValue('avgRebounds', 'rpg') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">APG</p>
              <p className="text-3xl font-black text-purple-900">{getStatValue('avgAssists', 'apg') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">FG%</p>
              <p className="text-3xl font-black text-red-900">{getStatValue('fieldGoalPct', 'fgPct') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide mb-1">3P%</p>
              <p className="text-3xl font-black text-yellow-900">{getStatValue('threePointFieldGoalPct', 'fg3Pct') || getStatValue('threePointPct', 'fg3Pct') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">FT%</p>
              <p className="text-3xl font-black text-orange-900">{getStatValue('freeThrowPct', 'ftPct') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">SPG</p>
              <p className="text-3xl font-black text-indigo-900">{getStatValue('avgSteals') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
              <p className="text-xs text-pink-600 font-medium uppercase tracking-wide mb-1">BPG</p>
              <p className="text-3xl font-black text-pink-900">{getStatValue('avgBlocks') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wide mb-1">MPG</p>
              <p className="text-3xl font-black text-teal-900">{getStatValue('avgMinutes', 'mpg') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl">
              <p className="text-xs text-cyan-600 font-medium uppercase tracking-wide mb-1">TOV</p>
              <p className="text-3xl font-black text-cyan-900">{getStatValue('avgTurnovers') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl">
              <p className="text-xs text-lime-600 font-medium uppercase tracking-wide mb-1">GP</p>
              <p className="text-3xl font-black text-lime-900">{getStatValue('gamesPlayed') || 'N/A'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl">
              <p className="text-xs text-rose-600 font-medium uppercase tracking-wide mb-1">GS</p>
              <p className="text-3xl font-black text-rose-900">{getStatValue('gamesStarted') || 'N/A'}</p>
            </div>
          </div>
        </div>


        {/* Recent Games */}
        {gameLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📈</div>
              <h2 className="text-2xl font-black text-gray-900">Recent Games (Last 10)</h2>
            </div>

            <div className="space-y-3">
              {gameLogs.map((game: any, index: number) => {
                const gameDate = new Date(game.gameDate);
                const opponent = game.opponent?.abbreviation || 'N/A';
                const opponentName = game.opponent?.displayName || opponent;
                const won = game.gameResult === 'W';

                return (
                  <div key={index} className={`p-4 rounded-xl border-2 transition-all ${
                    won ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          won ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {game.gameResult || 'N/A'}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="font-bold text-gray-900">
                            {game.atVs} {opponentName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">
                          {game.score || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Final
                        </p>
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
