import { Game } from '@/lib/types';
import { getTeamLogoUrl } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';

interface ScoreCardProps {
  game: Game;
}

// Helper function to format game clock from ISO 8601 duration format (PT08M33.00S) to readable format (8:33)
function formatGameClock(clock: string): string {
  if (!clock) return '';

  // Handle ISO 8601 duration format (PT08M33.00S or PT8M33S)
  if (clock.startsWith('PT')) {
    const minutesMatch = clock.match(/(\d+)M/);
    const secondsMatch = clock.match(/(\d+(?:\.\d+)?)S/);

    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? Math.floor(parseFloat(secondsMatch[1])) : 0;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // If already in readable format, return as-is
  return clock;
}

export default function ScoreCard({ game }: ScoreCardProps) {
  const isLive = game.gameStatus.status === 2;
  const isFinished = game.gameStatus.status === 3;
  const isUpcoming = game.gameStatus.status === 1;

  const getStatusDisplay = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-600 font-semibold">
            Q{game.period} {formatGameClock(game.gameClock)}
          </span>
        </div>
      );
    }
    if (isFinished) {
      return <span className="text-gray-500 font-medium">FINAL</span>;
    }
    if (isUpcoming) {
      const gameTime = new Date(game.gameTimeUTC);
      return (
        <span className="text-gray-500">
          {gameTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short',
          })}
        </span>
      );
    }
    return <span className="text-gray-500">{game.gameStatusText}</span>;
  };

  const awayWinning = game.awayTeam.score > game.homeTeam.score;
  const homeWinning = game.homeTeam.score > game.awayTeam.score;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      <Link href={`/games/${game.gameId}`} className="block p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {new Date(game.gameTimeUTC).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div>{getStatusDisplay()}</div>
        </div>

      {/* Away Team */}
      <div
        className={`flex justify-between items-center py-3 px-4 rounded-lg transition-all ${
          isFinished && awayWinning ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={getTeamLogoUrl(game.awayTeam.teamTricode, 'small')}
              alt={`${game.awayTeam.teamName} logo`}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-lg text-gray-900">{game.awayTeam.teamTricode}</span>
            <span className="text-xs text-gray-500 font-medium">
              {game.awayTeam.wins}-{game.awayTeam.losses}
            </span>
          </div>
        </div>
        <div
          className={`text-3xl font-black ${
            isFinished && awayWinning ? 'text-orange-600' : 'text-gray-800'
          }`}
        >
          {game.awayTeam.score}
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex justify-center my-2">
        <span className="text-xs font-semibold text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
          {isUpcoming ? '@' : 'vs'}
        </span>
      </div>

      {/* Home Team */}
      <div
        className={`flex justify-between items-center py-3 px-4 rounded-lg transition-all ${
          isFinished && homeWinning ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={getTeamLogoUrl(game.homeTeam.teamTricode, 'small')}
              alt={`${game.homeTeam.teamName} logo`}
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-lg text-gray-900">{game.homeTeam.teamTricode}</span>
            <span className="text-xs text-gray-500 font-medium">
              {game.homeTeam.wins}-{game.homeTeam.losses}
            </span>
          </div>
        </div>
        <div
          className={`text-3xl font-black ${
            isFinished && homeWinning ? 'text-orange-600' : 'text-gray-800'
          }`}
        >
          {game.homeTeam.score}
        </div>
      </div>
      </Link>
    </div>
  );
}
