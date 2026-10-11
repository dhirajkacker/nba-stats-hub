// Hand-checked facts for each WNBA season the site covers. The freeze script
// and scripts/verify/wnba-data.ts compare ESPN's data against this table and
// fail on any disagreement, so a mistake here (or in ESPN's data) surfaces.
//
// Champion, runner-up, Finals score and Finals MVP: Wikipedia's "List of WNBA
// champions", cross-checked against ESPN's playoff results for each season.
//
// Relative imports only (used by scripts/ as well as the app).

export type RoundId = 'CSF' | 'CF' | 'R1' | 'R2' | 'SF' | 'F';

export type PlayoffFormatId = 'conference' | 'single-elim' | 'eight-team';

export interface RoundSpec {
  id: RoundId;
  name: string;
  /** Number of series (or single games) in the round. */
  count: number;
  /** Best-of length when ESPN doesn't say (single-elimination rounds are 1). */
  defaultBestOf: number;
}

export const PLAYOFF_FORMATS: Record<PlayoffFormatId, { label: string; rounds: RoundSpec[] }> = {
  // 2010-2015: top four in each conference.
  conference: {
    label: 'Top 4 per conference',
    rounds: [
      { id: 'CSF', name: 'Conference Semifinals', count: 4, defaultBestOf: 3 },
      { id: 'CF', name: 'Conference Finals', count: 2, defaultBestOf: 3 },
      { id: 'F', name: 'WNBA Finals', count: 1, defaultBestOf: 5 },
    ],
  },
  // 2016-2021: top eight league-wide; rounds 1-2 are single games, and the top
  // four seeds get byes (seeds 1-2 into the semifinals, seeds 3-4 into round 2).
  'single-elim': {
    label: 'Top 8, single-game early rounds with byes',
    rounds: [
      { id: 'R1', name: 'First Round', count: 2, defaultBestOf: 1 },
      { id: 'R2', name: 'Second Round', count: 2, defaultBestOf: 1 },
      { id: 'SF', name: 'Semifinals', count: 2, defaultBestOf: 5 },
      { id: 'F', name: 'WNBA Finals', count: 1, defaultBestOf: 5 },
    ],
  },
  // 2022 on: top eight league-wide, 1v8 / 2v7 / 3v6 / 4v5.
  'eight-team': {
    label: 'Top 8, seeded bracket',
    rounds: [
      { id: 'R1', name: 'First Round', count: 4, defaultBestOf: 3 },
      { id: 'SF', name: 'Semifinals', count: 2, defaultBestOf: 5 },
      { id: 'F', name: 'WNBA Finals', count: 1, defaultBestOf: 5 },
    ],
  },
};

export interface WnbaSeasonFacts {
  season: string;
  /** Teams in the league that season. */
  teams: number;
  /** Regular-season games per team. */
  games: number;
  format: PlayoffFormatId;
  /** Whose seeds ESPN's playoffSeed reports: conference seeds before 2016. */
  seeding: 'conference' | 'league';
  /** Null while the season's Finals haven't finished. */
  champion: string | null;
  runnerUp: string | null;
  /** Champion's wins first, e.g. "3-1". */
  finalsScore: string | null;
  finalsMVP: string | null;
  /**
   * League-wide seeds by team id, for seasons where ESPN's playoffSeed is wrong.
   * 2016: ESPN reports conference seeds (two 1 seeds, two 2 seeds...). These
   * come from the actual bracket: first round 5 IND v 8 PHX and 6 ATL v 7 SEA,
   * second round 3 NY and 4 CHI, byes to the semifinals for 1 MIN and 2 LA.
   * Non-playoff teams follow by record.
   */
  seedOverrides?: Record<string, number>;
}

function f(
  season: number, teams: number, games: number,
  champion: string | null, runnerUp: string | null, finalsScore: string | null, finalsMVP: string | null,
): WnbaSeasonFacts {
  const format: PlayoffFormatId = season <= 2015 ? 'conference' : season <= 2021 ? 'single-elim' : 'eight-team';
  return {
    season: String(season), teams, games, format,
    seeding: season <= 2015 ? 'conference' : 'league',
    champion, runnerUp, finalsScore, finalsMVP,
  };
}

export const WNBA_SEASON_FACTS: WnbaSeasonFacts[] = [
  f(2026, 15, 44, null, null, null, null),
  f(2025, 13, 44, 'Las Vegas Aces', 'Phoenix Mercury', '4-0', "A'ja Wilson"),
  f(2024, 12, 40, 'New York Liberty', 'Minnesota Lynx', '3-2', 'Jonquel Jones'),
  f(2023, 12, 40, 'Las Vegas Aces', 'New York Liberty', '3-1', "A'ja Wilson"),
  f(2022, 12, 36, 'Las Vegas Aces', 'Connecticut Sun', '3-1', 'Chelsea Gray'),
  f(2021, 12, 32, 'Chicago Sky', 'Phoenix Mercury', '3-1', 'Kahleah Copper'),
  f(2020, 12, 22, 'Seattle Storm', 'Las Vegas Aces', '3-0', 'Breanna Stewart'),
  f(2019, 12, 34, 'Washington Mystics', 'Connecticut Sun', '3-2', 'Emma Meesseman'),
  f(2018, 12, 34, 'Seattle Storm', 'Washington Mystics', '3-0', 'Breanna Stewart'),
  f(2017, 12, 34, 'Minnesota Lynx', 'Los Angeles Sparks', '3-2', 'Sylvia Fowles'),
  {
    ...f(2016, 12, 34, 'Los Angeles Sparks', 'Minnesota Lynx', '3-2', 'Candace Parker'),
    // ids: MIN 8, LA 6, NY 9, CHI 19, IND 5, ATL 20, SEA 14, PHX 11, CON 18, WSH 16, DAL 3, SA 17
    seedOverrides: { '8': 1, '6': 2, '9': 3, '19': 4, '5': 5, '20': 6, '14': 7, '11': 8, '18': 9, '16': 10, '3': 11, '17': 12 },
  },
  f(2015, 12, 34, 'Minnesota Lynx', 'Indiana Fever', '3-2', 'Sylvia Fowles'),
  f(2014, 12, 34, 'Phoenix Mercury', 'Chicago Sky', '3-0', 'Diana Taurasi'),
  f(2013, 12, 34, 'Minnesota Lynx', 'Atlanta Dream', '3-0', 'Maya Moore'),
  f(2012, 12, 34, 'Indiana Fever', 'Minnesota Lynx', '3-1', 'Tamika Catchings'),
  f(2011, 12, 34, 'Minnesota Lynx', 'Atlanta Dream', '3-0', 'Seimone Augustus'),
  f(2010, 12, 34, 'Seattle Storm', 'Atlanta Dream', '3-0', 'Lauren Jackson'),
];

export function wnbaSeasonFacts(season: string): WnbaSeasonFacts | null {
  return WNBA_SEASON_FACTS.find((s) => s.season === season) ?? null;
}
