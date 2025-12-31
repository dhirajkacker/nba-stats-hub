import { getStandings } from '@/lib/nba-api';
import { getTeamLogoUrl, getTeamColor } from '@/lib/team-logos';
import { getTeamStats, getTeamGameLog, getTeamRosterWithStats } from '@/lib/espn-team-stats';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface TeamPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;

  // Fetch standings to get team data
  const standings = await getStandings();
  const team = standings?.standings.find(
    (t) => t.teamTricode.toLowerCase() === teamId.toLowerCase()
  );

  if (!team) {
    notFound();
  }

  // Fetch advanced stats, game log, and roster in parallel
  const [teamStats, gameLogs, roster] = await Promise.all([
    getTeamStats(team.teamTricode),
    getTeamGameLog(team.teamTricode, 10),
    getTeamRosterWithStats(team.teamTricode)
  ]);

  const teamColor = getTeamColor(team.teamTricode);

  // Calculate additional stats
  const winPctDisplay = (team.winPct * 100).toFixed(1);
  const totalGames = team.wins + team.losses;

  // Extract team stats from all categories (general, offensive, defensive)
  const allCategories = teamStats?.results?.stats?.categories || [];
  const allStats: any[] = [];
  allCategories.forEach((cat: any) => {
    if (cat.stats) {
      allStats.push(...cat.stats);
    }
  });

  const getStat = (name: string): string => {
    const stat = allStats.find((s: any) => s.name === name);

    if (!stat) {
      return '0';
    }

    // Try displayValue first (string), then value (number)
    let result = stat.displayValue ?? stat.value;

    // Ensure we're not returning an object
    if (typeof result === 'object' && result !== null) {
      console.warn(`Stat ${name} is an object, extracting value:`, result);
      return String(result.displayValue || result.value || '0');
    }

    // Convert to string and return
    if (result === undefined || result === null) {
      return '0';
    }

    return String(result);
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
          <Link href="/teams" className="text-gray-200 hover:text-white mb-4 inline-block">
            ← Back to All Teams
          </Link>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 bg-white rounded-xl p-4 shadow-lg">
              <Image
                src={getTeamLogoUrl(team.teamTricode, 'medium')}
                alt={`${team.teamName} logo`}
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight mb-2">
                {team.teamCity} {team.teamName}
              </h1>
              <div className="flex items-center gap-4 text-xl">
                <span className="font-bold">{team.wins}-{team.losses}</span>
                <span className="text-gray-300">•</span>
                <span>{team.conference}ern Conference</span>
                <span className="text-gray-300">•</span>
                <span>#{team.confRank} Seed</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: teamColor }}>
            <p className="text-gray-600 text-sm font-medium mb-1">Record</p>
            <p className="text-3xl font-black text-gray-900">{team.wins}-{team.losses}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Win %</p>
            <p className="text-3xl font-black text-gray-900">{winPctDisplay}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Games Behind</p>
            <p className="text-3xl font-black text-gray-900">
              {team.gamesBehind === 0 ? '-' : team.gamesBehind.toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Conference Rank</p>
            <p className="text-3xl font-black text-gray-900">#{team.confRank}</p>
          </div>
        </div>

        {/* Season Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-900">Season Overview</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Record */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Games</span>
                  <span className="font-bold text-gray-900">{totalGames}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Wins</span>
                  <span className="font-bold text-green-600">{team.wins}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Losses</span>
                  <span className="font-bold text-red-600">{team.losses}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Win Percentage</span>
                  <span className="font-bold text-gray-900">{team.winPct.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Conference Standings */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Conference Standing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Conference</span>
                  <span className="font-bold text-gray-900">{team.conference}ern</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Conference Rank</span>
                  <span className="font-bold text-gray-900">#{team.confRank}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Games Behind Leader</span>
                  <span className="font-bold text-gray-900">
                    {team.gamesBehind === 0 ? 'Leading' : team.gamesBehind.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Team Stats */}
        {allStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📊</div>
              <h2 className="text-2xl font-black text-gray-900">Advanced Team Stats</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">PPG</p>
              <p className="text-3xl font-black text-blue-900">{getStat('avgPoints')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">RPG</p>
              <p className="text-3xl font-black text-green-900">{getStat('avgRebounds')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">APG</p>
              <p className="text-3xl font-black text-purple-900">{getStat('avgAssists')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">FG%</p>
              <p className="text-3xl font-black text-red-900">{getStat('fieldGoalPct')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide mb-1">3P%</p>
              <p className="text-3xl font-black text-yellow-900">{getStat('threePointFieldGoalPct')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">FT%</p>
              <p className="text-3xl font-black text-orange-900">{getStat('freeThrowPct')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">SPG</p>
              <p className="text-3xl font-black text-indigo-900">{getStat('avgSteals')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
              <p className="text-xs text-pink-600 font-medium uppercase tracking-wide mb-1">BPG</p>
              <p className="text-3xl font-black text-pink-900">{getStat('avgBlocks')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl">
              <p className="text-xs text-cyan-600 font-medium uppercase tracking-wide mb-1">TOV</p>
              <p className="text-3xl font-black text-cyan-900">{getStat('avgTurnovers')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wide mb-1">FTM</p>
              <p className="text-3xl font-black text-teal-900">{getStat('avgFreeThrowsMade')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl">
              <p className="text-xs text-lime-600 font-medium uppercase tracking-wide mb-1">FTA</p>
              <p className="text-3xl font-black text-lime-900">{getStat('avgFreeThrowsAttempted')}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl">
              <p className="text-xs text-rose-600 font-medium uppercase tracking-wide mb-1">PF</p>
              <p className="text-3xl font-black text-rose-900">{getStat('avgPersonalFouls')}</p>
            </div>
            </div>
          </div>
        )}

        {/* Team Roster */}
        {roster.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">👥</div>
              <h2 className="text-2xl font-black text-gray-900">Team Roster</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roster.map((player: any) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    {player.headshot ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={player.headshot}
                          alt={player.displayName}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                        {player.displayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {player.jersey && `#${player.jersey} • `}
                        {player.position}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Games / Game Log */}
        {gameLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📈</div>
              <h2 className="text-2xl font-black text-gray-900">Recent Games (Last 10)</h2>
            </div>

            <div className="space-y-4">
              {gameLogs.map((game: any, index: number) => {
                const competition = game.competitions?.[0];
                const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
                const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');
                const isHomeTeam = homeTeam?.team?.abbreviation === team.teamTricode;
                const teamData = isHomeTeam ? homeTeam : awayTeam;
                const opponentData = isHomeTeam ? awayTeam : homeTeam;
                const won = teamData?.winner;
                const gameDate = new Date(game.date);

                // Safely extract opponent name
                const opponentName = String(opponentData?.team?.displayName || opponentData?.team?.abbreviation || 'Unknown');

                // Safely extract scores - handle if they're objects with displayValue
                const extractScore = (scoreData: any): string => {
                  if (scoreData === undefined || scoreData === null) return '-';
                  if (typeof scoreData === 'object') {
                    return String(scoreData.displayValue || scoreData.value || '-');
                  }
                  return String(scoreData);
                };

                const teamScore = extractScore(teamData?.score);
                const opponentScore = extractScore(opponentData?.score);

                // Safely extract status
                const statusDetail = String(competition?.status?.type?.detail || 'Final');

                return (
                  <div key={index} className={`p-4 rounded-xl border-2 transition-all ${
                    won ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          won ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {won ? 'W' : 'L'}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="font-bold text-gray-900">
                            {isHomeTeam ? 'vs' : '@'} {opponentName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">
                          {teamScore} - {opponentScore}
                        </p>
                        <p className="text-sm text-gray-600">
                          {statusDetail}
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
