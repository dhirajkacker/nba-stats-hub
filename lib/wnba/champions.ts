// Every WNBA champion, for the history page.
//
// 2010 on comes from the season table (lib/wnba/seasons.ts), which is
// validated against ESPN's playoff results. 1997-2009 is hand-entered:
// champion, runner-up and Finals MVP agree across Wikipedia's "List of WNBA
// champions" and "WNBA Finals" articles; each series score was confirmed on
// that year's Finals article or against ESPN's game results (ESPN's data
// before 2010 is incomplete, so it can't be the only source).

import { WNBA_SEASON_FACTS } from './seasons';

export interface WnbaChampionRow {
  year: number;
  champion: string;
  runnerUp: string;
  score: string;
  finalsMVP: string;
}

const BEFORE_2010: WnbaChampionRow[] = [
  { year: 2009, champion: 'Phoenix Mercury', runnerUp: 'Indiana Fever', score: '3-2', finalsMVP: 'Diana Taurasi' },
  { year: 2008, champion: 'Detroit Shock', runnerUp: 'San Antonio Silver Stars', score: '3-0', finalsMVP: 'Katie Smith' },
  { year: 2007, champion: 'Phoenix Mercury', runnerUp: 'Detroit Shock', score: '3-2', finalsMVP: 'Cappie Pondexter' },
  { year: 2006, champion: 'Detroit Shock', runnerUp: 'Sacramento Monarchs', score: '3-2', finalsMVP: 'Deanna Nolan' },
  { year: 2005, champion: 'Sacramento Monarchs', runnerUp: 'Connecticut Sun', score: '3-1', finalsMVP: 'Yolanda Griffith' },
  { year: 2004, champion: 'Seattle Storm', runnerUp: 'Connecticut Sun', score: '2-1', finalsMVP: 'Betty Lennox' },
  { year: 2003, champion: 'Detroit Shock', runnerUp: 'Los Angeles Sparks', score: '2-1', finalsMVP: 'Ruth Riley' },
  { year: 2002, champion: 'Los Angeles Sparks', runnerUp: 'New York Liberty', score: '2-0', finalsMVP: 'Lisa Leslie' },
  { year: 2001, champion: 'Los Angeles Sparks', runnerUp: 'Charlotte Sting', score: '2-0', finalsMVP: 'Lisa Leslie' },
  { year: 2000, champion: 'Houston Comets', runnerUp: 'New York Liberty', score: '2-0', finalsMVP: 'Cynthia Cooper' },
  { year: 1999, champion: 'Houston Comets', runnerUp: 'New York Liberty', score: '2-1', finalsMVP: 'Cynthia Cooper' },
  { year: 1998, champion: 'Houston Comets', runnerUp: 'Phoenix Mercury', score: '2-1', finalsMVP: 'Cynthia Cooper' },
  // 1997 was a single championship game.
  { year: 1997, champion: 'Houston Comets', runnerUp: 'New York Liberty', score: '1-0', finalsMVP: 'Cynthia Cooper' },
];

/** Completed seasons, newest first. A live season appears once its Finals end and it's added to the table. */
export const WNBA_CHAMPIONS: WnbaChampionRow[] = [
  ...WNBA_SEASON_FACTS
    .filter((f) => f.champion && f.runnerUp && f.finalsScore && f.finalsMVP)
    .map((f) => ({
      year: parseInt(f.season, 10),
      champion: f.champion!,
      runnerUp: f.runnerUp!,
      score: f.finalsScore!,
      finalsMVP: f.finalsMVP!,
    })),
  ...BEFORE_2010,
];
