// Per-league Tailwind class sets. NBA values are the site's original classes,
// so NBA pages render exactly as before. Class names must stay literal strings
// here so Tailwind's scanner picks them up.

import type { LeagueId } from './leagues';

export interface LeagueTheme {
  pageBg: string;
  headerGradient: string;
  accentBar: string;
  headerSubtle: string;
  spinner: string;
}

export const THEMES: Record<LeagueId, LeagueTheme> = {
  nba: {
    pageBg: 'bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100',
    headerGradient: 'bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500',
    accentBar: 'h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full',
    headerSubtle: 'text-orange-200',
    spinner: 'border-orange-600',
  },
  wnba: {
    pageBg: 'bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100',
    headerGradient: 'bg-gradient-to-r from-black via-stone-800 to-orange-700 text-white shadow-2xl border-b-4 border-orange-600',
    accentBar: 'h-1 w-12 bg-gradient-to-r from-orange-600 to-amber-400 rounded-full',
    headerSubtle: 'text-amber-200',
    spinner: 'border-orange-700',
  },
};

export function theme(league: LeagueId): LeagueTheme {
  return THEMES[league];
}
