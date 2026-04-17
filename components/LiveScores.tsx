'use client';

import { useState, useEffect } from 'react';
import ScoreCard from './ScoreCard';
import { Scoreboard } from '@/lib/types';

interface LiveScoresProps {
  initialScoreboard?: Scoreboard | null;
}

// Helper to format date as YYYY-MM-DD in the user's local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert a user's local date to the corresponding ET date for ESPN API
// When it's April 6 in India (IST), it's still April 5 in ET
function localDateToETDate(localDateStr: string): string {
  // Create a Date at midnight of the local date, then format in ET
  const d = new Date(localDateStr + 'T00:00:00');
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// Helper to get date display string (always relative to user's local date)
function getDateDisplay(dateString: string): string {
  const today = formatDateLocal(new Date());
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateLocal(d); })();
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return formatDateLocal(d); })();

  if (dateString === today) return "Today's Games";
  if (dateString === yesterday) return 'Yesterday';
  if (dateString === tomorrow) return 'Tomorrow';

  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export default function LiveScores({ initialScoreboard }: LiveScoresProps) {
  const [selectedDate, setSelectedDate] = useState<string>(formatDateLocal(new Date()));
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(initialScoreboard || null);
  const [isLoading, setIsLoading] = useState(!initialScoreboard);
  const [error, setError] = useState<string | null>(null);

  // Convert selectedDate (local) to ET for ESPN API
  const espnDate = localDateToETDate(selectedDate);

  // Fetch scoreboard when date changes
  useEffect(() => {
    async function fetchScoreboard() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/scores?date=${espnDate}`);

        if (!response.ok) {
          throw new Error('Failed to fetch scores');
        }

        const data = await response.json();
        setScoreboard(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching scores:', err);
        setError('Failed to load scores');
      } finally {
        setIsLoading(false);
      }
    }

    fetchScoreboard();
  }, [espnDate]);

  // Auto-refresh for live games
  useEffect(() => {
    const hasLiveGames = scoreboard?.games.some((game) => game.gameStatus.status === 2);

    if (!hasLiveGames) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scores?date=${espnDate}`);
        if (response.ok) {
          const data = await response.json();
          setScoreboard(data);
        }
      } catch (err) {
        console.error('Error refreshing scores:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [scoreboard, espnDate]);

  // Date navigation handlers
  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const todayLocal = formatDateLocal(new Date());
    const todayDate = new Date(todayLocal + 'T00:00:00');

    const minDate = new Date(todayDate);
    minDate.setDate(minDate.getDate() - 3);

    if (currentDate > minDate) {
      currentDate.setDate(currentDate.getDate() - 1);
      setSelectedDate(formatDateLocal(currentDate));
    }
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const todayLocal = formatDateLocal(new Date());
    const todayDate = new Date(todayLocal + 'T00:00:00');

    const maxDate = new Date(todayDate);
    maxDate.setDate(maxDate.getDate() + 3);

    if (currentDate < maxDate) {
      currentDate.setDate(currentDate.getDate() + 1);
      setSelectedDate(formatDateLocal(currentDate));
    }
  };

  const handleToday = () => {
    setSelectedDate(formatDateLocal(new Date()));
  };

  // Check if navigation buttons should be disabled
  const isPreviousDisabled = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const todayDate = new Date(formatDateLocal(new Date()) + 'T00:00:00');
    const minDate = new Date(todayDate);
    minDate.setDate(minDate.getDate() - 3);
    return currentDate <= minDate;
  };

  const isNextDisabled = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const todayDate = new Date(formatDateLocal(new Date()) + 'T00:00:00');
    const maxDate = new Date(todayDate);
    maxDate.setDate(maxDate.getDate() + 3);
    return currentDate >= maxDate;
  };

  if (error && !scoreboard) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const games = scoreboard?.games ?? [];
  const liveGames = games.filter((game) => game.gameStatus.status === 2);
  const finishedGames = games.filter((game) => game.gameStatus.status === 3);
  const upcomingGames = games.filter((game) => game.gameStatus.status === 1);

  return (
    <div className="space-y-6">
      {/* Date Navigation Panel */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousDay}
            disabled={isPreviousDisabled()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-xl">←</span>
            <span className="text-sm font-semibold">Previous</span>
          </button>

          <div className="flex flex-col items-center gap-1">
            <h3 className="text-2xl font-black text-gray-900">
              {getDateDisplay(selectedDate)}
            </h3>
            <button
              onClick={handleToday}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold uppercase tracking-wide"
            >
              Jump to Today
            </button>
          </div>

          <button
            onClick={handleNextDay}
            disabled={isNextDisabled()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-sm font-semibold">Next</span>
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
          <p className="text-blue-600 text-sm">Loading games...</p>
        </div>
      )}

      {!isLoading && games.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No games scheduled for {getDateDisplay(selectedDate).toLowerCase().replace("'s games", '')}</p>
          <p className="text-gray-400 text-sm mt-2">
            Use the navigation above to check other days
          </p>
        </div>
      )}

      {liveGames.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-2xl font-black text-gray-900">
              Live Games
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
              {liveGames.length} Active
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {liveGames.map((game) => (
              <ScoreCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      )}

      {finishedGames.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-8 bg-gray-400 rounded-full"></div>
            <h3 className="text-2xl font-black text-gray-900">Final</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {finishedGames.map((game) => (
              <ScoreCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      )}

      {upcomingGames.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-8 bg-blue-400 rounded-full"></div>
            <h3 className="text-2xl font-black text-gray-900">Upcoming</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingGames.map((game) => (
              <ScoreCard key={game.gameId} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
