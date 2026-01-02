import { getStandings } from '@/lib/nba-api';
import { getTeamLogoUrl, getTeamColor } from '@/lib/team-logos';
import { getTeamStats, getTeamGameLog, getTeamRosterWithStats } from '@/lib/espn-team-stats';
import { resolveTeamIdentifier, normalizeTricode } from '@/lib/team-identifiers';
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

  // Resolve the URL identifier to a standard tricode
  // This handles various inputs: "utah" -> "UTA", "jazz" -> "UTA", "uta" -> "UTA"
  const resolvedTricode = resolveTeamIdentifier(teamId);

  if (!resolvedTricode) {
    notFound();
  }

  // Fetch standings to get team data
  const standings = await getStandings();
  const team = standings?.standings.find(
    (t) => normalizeTricode(t.teamTricode) === resolvedTricode
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
                unoptimized
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
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
            </div>
          </div>
        )}

        {/* Team Roster */}
        {roster.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900">Team Roster</h2>
              <span className="text-sm text-gray-500 ml-2">Sorted by PPG</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {roster.map((player: any) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-orange-500 hover:shadow-xl transition-all"
                >
                  {/* Player Header */}
                  <div className="p-4 flex items-center gap-4">
                    {player.headshot ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-3 ring-gray-200 group-hover:ring-orange-400 transition-all shadow-md">
                        <Image
                          src={player.headshot}
                          alt={player.displayName}
                          width={80}
                          height={80}
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 ring-3 ring-gray-200 shadow-md">
                        <span className="text-3xl">⛹️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                        {player.displayName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {player.jersey && (
                          <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                            #{player.jersey}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                          {player.position}
                        </span>
                        {player.stats?.gamesPlayed > 0 && (
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {player.stats.gamesPlayed} GP
                          </span>
                        )}
                      </div>
                      {/* Height & Weight */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {player.stats?.height && player.stats.height !== '-' && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                            </svg>
                            {player.stats.height}
                          </span>
                        )}
                        {player.stats?.weight && player.stats.weight !== '-' && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            {player.stats.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Player Stats */}
                  <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                    <div className="p-3 text-center bg-gradient-to-b from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-150 transition-colors">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">PPG</p>
                      <p className="text-xl font-black text-blue-900">{player.stats?.ppg?.toFixed(1) || '-'}</p>
                    </div>
                    <div className="p-3 text-center bg-gradient-to-b from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-150 transition-colors">
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">RPG</p>
                      <p className="text-xl font-black text-green-900">{player.stats?.rpg?.toFixed(1) || '-'}</p>
                    </div>
                    <div className="p-3 text-center bg-gradient-to-b from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-150 transition-colors">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">APG</p>
                      <p className="text-xl font-black text-purple-900">{player.stats?.apg?.toFixed(1) || '-'}</p>
                    </div>
                    <div className="p-3 text-center bg-gradient-to-b from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-150 transition-colors">
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">FG%</p>
                      <p className="text-xl font-black text-orange-900">{player.stats?.fgPct?.toFixed(1) || '-'}</p>
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900">Recent Games</h2>
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
