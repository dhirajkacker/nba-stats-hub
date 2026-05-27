// Single source of truth for season identifiers and per-season conversions.
//
// To advance the current season (when 2026-27 starts in October 2026):
//   1. Change CURRENT_SEASON below
//   2. Prepend the new value to KNOWN_SEASONS
//   3. Update the redirect destinations in next.config.ts to point at the new
//      CURRENT_SEASON (they're inlined at build time so they need to change too).

export const CURRENT_SEASON = '2025-26';

// Newest-first. The season nav iterates this array in order.
export const KNOWN_SEASONS = [
  '2025-26',
  '2024-25',
  '2023-24',
  '2022-23',
  '2021-22',
  '2020-21',
  '2019-20',
  '2018-19',
  '2017-18',
  '2016-17',
  '2015-16',
  '2014-15',
  '2013-14',
  '2012-13',
  '2011-12',
  '2010-11',
] as const;

export type SeasonId = (typeof KNOWN_SEASONS)[number];

export function isKnownSeason(s: string): s is SeasonId {
  return (KNOWN_SEASONS as readonly string[]).includes(s);
}

export function isCurrentSeason(s: string): boolean {
  return s === CURRENT_SEASON;
}

// "2025-26" -> 2026 (ESPN uses the end-year of the NBA season).
export function seasonToESPNYear(season: string): number {
  const [start] = season.split('-');
  return parseInt(start) + 1;
}

// "2025-26" -> "2026-04-15". A date that reliably falls in the final week
// of the regular season; used as the anchor for snapshot-style fetches that
// walk backwards looking for regular-season games.
//
// Exceptions are listed below for seasons whose regular season ended outside
// the usual mid-April window.
const REGULAR_SEASON_END_OVERRIDES: Record<string, string> = {
  // COVID-shortened 72-game season — RS ended May 16, 2021.
  '2020-21': '2021-05-16',
  // Bubble season — RS paused March 2020, resumed in late July; the "end" for
  // standings purposes is August 14, 2020 (Orlando seeding games concluded).
  '2019-20': '2020-08-14',
  // Lockout-shortened 66-game season — RS ended April 26, 2012.
  '2011-12': '2012-04-26',
};

export function seasonRegularSeasonEndDate(season: string): string {
  if (REGULAR_SEASON_END_OVERRIDES[season]) return REGULAR_SEASON_END_OVERRIDES[season];
  const [, endTwo] = season.split('-');
  const endYear = 2000 + parseInt(endTwo);
  return `${endYear}-04-15`;
}

// "2025-26" -> "2026-06-30". Anchor for snapshot-style playoff fetches.
// Late June covers any Finals run, including game 7s. The freeze script then
// scans ±90/30 days around this date to capture the full play-in + playoffs.
const POSTSEASON_ANCHOR_OVERRIDES: Record<string, string> = {
  // COVID-shortened season — Finals ended July 20, 2021.
  '2020-21': '2021-07-15',
  // Bubble season — Finals ended October 11, 2020.
  '2019-20': '2020-10-01',
};

export function seasonPostseasonAnchorDate(season: string): string {
  if (POSTSEASON_ANCHOR_OVERRIDES[season]) return POSTSEASON_ANCHOR_OVERRIDES[season];
  const [, endTwo] = season.split('-');
  const endYear = 2000 + parseInt(endTwo);
  return `${endYear}-06-30`;
}

export function seasonLabel(season: string): string {
  return `${season} Season`;
}
