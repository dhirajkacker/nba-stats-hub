import { getTodayScoreboard } from '@/lib/nba-api';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface GamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;

  // Fetch today's scoreboard to find this game
  const scoreboard = await getTodayScoreboard();
  const game = scoreboard?.games.find((g) => g.gameId === gameId);

  if (!game) {
    notFound();
  }

  const isLive = game.gameStatus.status === 2;
  const isFinished = game.gameStatus.status === 3;
  const isUpcoming = game.gameStatus.status === 1;

  const awayWinning = game.awayTeam.score > game.homeTeam.score;
  const homeWinning = game.homeTeam.score > game.awayTeam.score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Game Details
          </h1>
          <p className="text-orange-200 font-medium">
            {new Date(game.gameTimeUTC).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Status Banner */}
        {isLive && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg p-4 mb-8 flex items-center justify-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <span className="text-xl font-black">LIVE - Q{game.gameStatus.period} {game.gameStatus.gameClock}</span>
          </div>
        )}

        {/* Score Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 mb-8">
          {/* Away Team */}
          <Link
            href={`/teams/${game.awayTeam.teamTricode.toLowerCase()}`}
            className={`flex items-center justify-between p-8 transition-all hover:bg-gray-50 ${
              isFinished && awayWinning ? 'bg-gradient-to-r from-orange-50 to-orange-100' : ''
            }`}
          >
            <div className="flex items-center gap-6 flex-1">
              <div className="relative w-24 h-24">
                <Image
                  src={getTeamLogoUrl(game.awayTeam.teamTricode, 'medium')}
                  alt={`${game.awayTeam.teamName} logo`}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">
                  {game.awayTeam.teamCity} {game.awayTeam.teamName}
                </h2>
                <p className="text-lg text-gray-600">
                  {game.awayTeam.teamTricode} • {game.awayTeam.wins}-{game.awayTeam.losses}
                </p>
              </div>
            </div>
            <div
              className={`text-7xl font-black ${
                isFinished && awayWinning ? 'text-orange-600' : 'text-gray-800'
              }`}
            >
              {game.awayTeam.score}
            </div>
          </Link>

          {/* Divider */}
          <div className="bg-gray-100 py-3 px-8 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-gray-500 font-bold">
              {isLive && `Q${game.gameStatus.period} ${game.gameStatus.gameClock}`}
              {isFinished && 'FINAL'}
              {isUpcoming && `Starts ${new Date(game.gameTimeUTC).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
            </span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>

          {/* Home Team */}
          <Link
            href={`/teams/${game.homeTeam.teamTricode.toLowerCase()}`}
            className={`flex items-center justify-between p-8 transition-all hover:bg-gray-50 ${
              isFinished && homeWinning ? 'bg-gradient-to-r from-orange-50 to-orange-100' : ''
            }`}
          >
            <div className="flex items-center gap-6 flex-1">
              <div className="relative w-24 h-24">
                <Image
                  src={getTeamLogoUrl(game.homeTeam.teamTricode, 'medium')}
                  alt={`${game.homeTeam.teamName} logo`}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">
                  {game.homeTeam.teamCity} {game.homeTeam.teamName}
                </h2>
                <p className="text-lg text-gray-600">
                  {game.homeTeam.teamTricode} • {game.homeTeam.wins}-{game.homeTeam.losses}
                </p>
              </div>
            </div>
            <div
              className={`text-7xl font-black ${
                isFinished && homeWinning ? 'text-orange-600' : 'text-gray-800'
              }`}
            >
              {game.homeTeam.score}
            </div>
          </Link>
        </div>

        {/* Game Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-900">Game Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Status</span>
                <span className="font-bold text-gray-900">{game.gameStatusText}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Game ID</span>
                <span className="font-mono text-sm text-gray-900">{game.gameId}</span>
              </div>
              {isLive && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Period</span>
                  <span className="font-bold text-gray-900">Quarter {game.gameStatus.period}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Game Time</span>
                <span className="font-bold text-gray-900">
                  {new Date(game.gameTimeUTC).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Date</span>
                <span className="font-bold text-gray-900">
                  {new Date(game.gameTimeUTC).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Stats Coming Soon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Box Score</h3>
            <p className="text-gray-600 text-sm mb-4">
              Detailed player statistics and box score for this game
            </p>
            <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Coming Soon</span>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Play-by-Play</h3>
            <p className="text-gray-600 text-sm mb-4">
              Complete play-by-play breakdown of the game
            </p>
            <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
