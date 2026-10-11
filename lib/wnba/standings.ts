// WNBA standings from ESPN's v2 standings endpoint.
//
// level=1 is the league-wide table with ESPN's official playoffSeed (league
// seeds from 2016, conference seeds before). level=2 groups teams by
// conference. Team names, abbreviations and logos are as of that season
// (2010: San Antonio Silver Stars, SAS), and teamId is ESPN's franchise id.
//
// ESPN's response doesn't reliably say which season it returned (its seasons
// field reports the current year), and for 1997-2001 it silently returns the
// current season. Callers validate with team counts and win/loss totals.

import type { Standing, Standings } from '../types';
import { espnJson, WNBA, WNBA_STANDINGS_V2 } from './espn';
import { wnbaSeasonFacts } from './seasons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Entry = any;

function stat(entry: Entry, name: string): { value?: number; displayValue?: string; summary?: string } | undefined {
  return entry.stats?.find((s: Entry) => s.name === name || s.type === name || s.abbreviation === name);
}

function num(entry: Entry, name: string): number {
  const s = stat(entry, name);
  const v = s?.value ?? parseFloat(String(s?.displayValue ?? ''));
  return Number.isFinite(v) ? Number(v) : 0;
}

function record(entry: Entry, ...names: string[]): [number, number] {
  for (const n of names) {
    const s = stat(entry, n);
    const m = String(s?.displayValue ?? s?.summary ?? '').match(/^(\d+)-(\d+)/);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  }
  return [0, 0];
}

function gamesBehind(leader: Standing, team: Standing): number {
  return ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
}

/**
 * Standings for a WNBA season. Rows are ordered by conference (East first),
 * then by conference rank, matching the NBA Standings shape. Each row also
 * carries leagueRank, playoffSeed, clincher and the season's logo.
 */
export async function fetchWnbaStandings(season: string, revalidate = 600): Promise<Standings | null> {
  const [league, conf] = await Promise.all([
    espnJson(`${WNBA_STANDINGS_V2}?season=${season}&level=1`, revalidate),
    espnJson(`${WNBA_STANDINGS_V2}?season=${season}&level=2`, revalidate),
  ]);
  const leagueEntries: Entry[] = league?.standings?.entries ?? [];
  if (!leagueEntries.length || !conf?.children?.length) return null;

  // Conference membership from the level=2 groups.
  const conferenceOf = new Map<string, 'East' | 'West'>();
  for (const group of conf.children as Entry[]) {
    const isEast = /east/i.test(group.name ?? group.abbreviation ?? '');
    for (const e of group.standings?.entries ?? []) {
      conferenceOf.set(String(e.team.id), isEast ? 'East' : 'West');
    }
  }

  const seedOverrides = wnbaSeasonFacts(season)?.seedOverrides;

  // ESPN gives a relocated franchise's old seasons the current team's logo
  // (2010 Tulsa Shock shows the Dallas Wings logo, San Antonio shows the Las
  // Vegas Aces). When the season's team name differs from the franchise's
  // current name, drop the logo so pages show an initials badge instead.
  const current = await espnJson(`${WNBA.site}/teams`, 86400);
  const currentName = new Map<string, string>(
    (current?.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t: Entry) => [String(t.team.id), t.team.displayName]),
  );

  const rows: Standing[] = leagueEntries.map((e) => {
    const team = e.team;
    const wins = num(e, 'wins');
    const losses = num(e, 'losses');
    const [homeWins, homeLosses] = record(e, 'Home', 'home');
    const [awayWins, awayLosses] = record(e, 'Road', 'road', 'Away');
    const [confWins, confLosses] = record(e, 'vs. Conf.', 'vsconf');
    const [lastTenWins, lastTenLosses] = record(e, 'Last Ten Games', 'lasttengames', 'L10');
    const seed = seedOverrides?.[String(team.id)] ?? num(e, 'playoffSeed');
    const streak = stat(e, 'streak')?.displayValue ?? '-';
    const clincher = stat(e, 'clincher')?.displayValue;
    return {
      teamId: parseInt(team.id, 10),
      teamCity: team.location ?? '',
      teamName: team.name ?? '',
      teamTricode: team.abbreviation ?? '',
      conference: conferenceOf.get(String(team.id)) ?? 'West',
      confRank: 0,
      wins,
      losses,
      winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
      gamesBehind: 0,
      homeWins, homeLosses, awayWins, awayLosses,
      confWins, confLosses, lastTenWins, lastTenLosses,
      streak,
      logo: currentName.get(String(team.id)) === team.displayName ? team.logos?.[0]?.href ?? null : null,
      playoffSeed: seed > 0 ? seed : null,
      leagueRank: 0,
      ...(clincher && clincher !== '-' ? { clincher } : {}),
    };
  });

  // League rank: record first; ESPN's seed settles ties (it applies the real
  // tiebreakers); the team name is the final, stable fallback.
  const bySeedThenName = (a: Standing, b: Standing) =>
    (a.playoffSeed ?? 99) - (b.playoffSeed ?? 99) || a.teamCity.localeCompare(b.teamCity);
  const byRecord = (a: Standing, b: Standing) => b.winPct - a.winPct || b.wins - a.wins;

  [...rows].sort((a, b) => byRecord(a, b) || bySeedThenName(a, b))
    .forEach((t, i) => { t.leagueRank = i + 1; });

  const ordered: Standing[] = [];
  for (const confName of ['East', 'West'] as const) {
    const group = rows
      .filter((t) => t.conference === confName)
      .sort((a, b) => byRecord(a, b) || (a.leagueRank ?? 0) - (b.leagueRank ?? 0));
    group.forEach((t, i) => {
      t.confRank = i + 1;
      t.gamesBehind = gamesBehind(group[0], t);
    });
    ordered.push(...group);
  }

  return {
    season,
    seasonType: 'Regular Season',
    standings: ordered,
  };
}

/** Games behind the league leader (for the single league-wide table). */
export function leagueGamesBehind(rows: Standing[]): Map<number, number> {
  const sorted = [...rows].sort((a, b) => (a.leagueRank ?? 0) - (b.leagueRank ?? 0));
  const out = new Map<number, number>();
  if (!sorted.length) return out;
  for (const t of sorted) out.set(t.teamId, gamesBehind(sorted[0], t));
  return out;
}
