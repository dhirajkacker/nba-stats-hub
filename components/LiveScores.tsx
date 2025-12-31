'use client';

import { useState, useEffect } from 'react';
import ScoreCard from './ScoreCard';
import { Scoreboard } from '@/lib/types';

interface LiveScoresProps {
  initialScoreboard: Scoreboard | null;
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get date display string
function getDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export default function LiveScores({ initialScoreboard }: LiveScoresProps) {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(initialScoreboard);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch scoreboard when date changes
  useEffect(() => {
    async function fetchScoreboard() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/scores?date=${selectedDate}`);

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
  }, [selectedDate]);

  // Auto-refresh for live games
  useEffect(() => {
    const hasLiveGames = scoreboard?.games.some((game) => game.gameStatus.status === 2);

    if (!hasLiveGames) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scores?date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setScoreboard(data);
        }
      } catch (err) {
        console.error('Error refreshing scores:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [scoreboard, selectedDate]);

  // Date navigation handlers
  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 3);

    if (currentDate > minDate) {
      currentDate.setDate(currentDate.getDate() - 1);
      setSelectedDate(formatDate(currentDate));
    }
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 3);

    if (currentDate < maxDate) {
      currentDate.setDate(currentDate.getDate() + 1);
      setSelectedDate(formatDate(currentDate));
    }
  };

  const handleToday = () => {
    setSelectedDate(formatDate(new Date()));
  };

  // Check if navigation buttons should be disabled
  const isPreviousDisabled = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 3);
    return currentDate <= minDate;
  };

  const isNextDisabled = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
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

  if (!scoreboard || scoreboard.games.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-lg">No games scheduled for today</p>
        <p className="text-gray-400 text-sm mt-2">
          Check back during the NBA season for live scores and updates
        </p>
      </div>
    );
  }

  const liveGames = scoreboard.games.filter((game) => game.gameStatus.status === 2);
  const finishedGames = scoreboard.games.filter((game) => game.gameStatus.status === 3);
  const upcomingGames = scoreboard.games.filter((game) => game.gameStatus.status === 1);

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
