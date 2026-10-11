// WNBA season list. A WNBA season is one calendar year (May to October).
//
// Rollover (see CLAUDE.md):
//   - After the Finals: freeze the season, then set WNBA_LIVE_SEASON = null so
//     /wnba lands on the newly archived season through the offseason.
//   - When the next season's schedule exists (about April): set
//     WNBA_LIVE_SEASON to it and prepend it to WNBA_KNOWN_SEASONS.

export const WNBA_LIVE_SEASON: string | null = '2026';

export const WNBA_LANDING_SEASON = '2026';

// Newest first.
export const WNBA_KNOWN_SEASONS: readonly string[] = [
  '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018',
  '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010',
];
