// WNBA playoff bracket builder.
//
// ESPN's playoff headlines are inconsistent across eras (casing, truncation,
// some blank) and its round codes only exist from about 2019, so rounds are
// assigned from structure:
//   1. Collect postseason games for the season and group them into series by
//      the pair of team ids.
//   2. Each team's series, in date order, are its rounds. In 2016-2021 the
//      top seeds had byes, so a team's first series is offset by its seed.
//   3. Headlines and round codes are then used only as a cross-check; every
//      disagreement is recorded in `issues`.
// Relative imports only (used by scripts/ as well as the app).

import type { Standing } from '../types';
import { PLAYOFF_FORMATS, wnbaSeasonFacts, type PlayoffFormatId, type RoundId } from './seasons';
import { datesBetween, getWnbaScoreboardDay, getWnbaSeasonWindow } from './espn';

export interface WnbaPlayoffTeam {
  id: string;
  abbrev: string;
  name: string;
  shortName: string;
  logo: string | null;
  seed: number | null;
  conference?: 'East' | 'West';
}

export interface WnbaPlayoffGame {
  id: string;
  dateUTC: string;
  status: 'scheduled' | 'live' | 'final';
  statusDetail: string;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  gameNumber: number | null;
}

export interface WnbaSeries {
  key: string;
  round: RoundId;
  conference?: 'East' | 'West';
  /** Team with home court in game 1. */
  teamA: WnbaPlayoffTeam;
  teamB: WnbaPlayoffTeam;
  winsA: number;
  winsB: number;
  bestOf: number;
  completed: boolean;
  winnerId: string | null;
  games: WnbaPlayoffGame[];
}

export interface WnbaRound {
  id: RoundId;
  name: string;
  /** Series the format calls for; fewer exist while a live round is unset. */
  expected: number;
  series: WnbaSeries[];
}

export interface WnbaPlayoffs {
  season: string;
  format: PlayoffFormatId;
  rounds: WnbaRound[];
  /** Data-quality problems found while building. Empty means fully consistent. */
  issues: string[];
}

const ROUND_CODE: Record<string, RoundId> = { RD16: 'R1', QTR: 'R2', SEMI: 'SF', FINAL: 'F' };

/** Round implied by a headline, given the season's format. Null if unrecognised. */
export function roundFromHeadline(headline: string, format: PlayoffFormatId): RoundId | null {
  const h = headline.toUpperCase();
  if (/\bWNBA FINALS\b/.test(h)) return 'F';
  if (format === 'conference') {
    if (/CONFERENCE (SEMIFINALS|FIRST ROUND)/.test(h)) return 'CSF';
    if (/CONFERENCE FINALS/.test(h)) return 'CF';
    return null;
  }
  if (/\bSEMIFINALS\b/.test(h)) return 'SF';
  if (/\bSECOND ROUND\b/.test(h)) return 'R2';
  if (/\bFIRST ROUND\b/.test(h)) return 'R1';
  return null;
}

function mapStatus(type: { state?: string; completed?: boolean }): WnbaPlayoffGame['status'] {
  if (type?.completed) return 'final';
  if (type?.state === 'in') return 'live';
  return 'scheduled';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EspnEvent = any;

function isExhibition(event: EspnEvent): boolean {
  const comp = event.competitions?.[0];
  const code = comp?.type?.abbreviation;
  const headline = comp?.notes?.[0]?.headline ?? '';
  return code === 'CC' || code === 'ALLSTAR' || /commissioner|all-star/i.test(headline);
}

/**
 * Build the bracket for a season from ESPN scoreboards over the season's
 * postseason window. `standings` supplies seeds, conferences and the season's
 * team names and logos.
 */
export async function buildWnbaPlayoffs(
  season: string,
  standings: Standing[],
  options: { now?: Date; revalidate?: number } = {},
): Promise<WnbaPlayoffs> {
  const facts = wnbaSeasonFacts(season);
  const year = parseInt(season, 10);
  const format: PlayoffFormatId = facts?.format ?? (year <= 2015 ? 'conference' : year <= 2021 ? 'single-elim' : 'eight-team');
  const spec = PLAYOFF_FORMATS[format];
  const issues: string[] = [];
  const empty = (): WnbaPlayoffs => ({
    season, format, issues,
    rounds: spec.rounds.map((r) => ({ id: r.id, name: r.name, expected: r.count, series: [] })),
  });

  const window = await getWnbaSeasonWindow(year);
  if (!window) {
    issues.push('No postseason dates from ESPN');
    return empty();
  }
  const now = options.now ?? new Date();
  const horizon = new Date(now.getTime() + 40 * 86_400_000).toISOString().slice(0, 10);
  const end = window.postEnd < horizon ? window.postEnd : horizon;
  if (window.postStart > end) return empty();

  // ESPN's postseason start date can trail the first playoff games by a day
  // (2017's first round was Sep 6, its window starts Sep 7). Scan a few days
  // early; only postseason-typed games are kept below.
  const scanStart = new Date(`${window.postStart}T12:00:00Z`);
  scanStart.setUTCDate(scanStart.getUTCDate() - 5);
  const days = datesBetween(scanStart.toISOString().slice(0, 10), end);
  const all = (await Promise.all(days.map((d) => getWnbaScoreboardDay(d, options.revalidate)))).flat();

  const seen = new Set<string>();
  const events = all.filter((e: EspnEvent) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return e.season?.type === 3 && e.season?.year === year && !isExhibition(e);
  });

  const byId = new Map(standings.map((t) => [String(t.teamId), t]));
  const teamInfo = new Map<string, WnbaPlayoffTeam>();
  const teamFrom = (c: EspnEvent): WnbaPlayoffTeam => {
    const id = String(c.team.id);
    const cached = teamInfo.get(id);
    if (cached) return cached;
    const row = byId.get(id);
    if (!row) issues.push(`Playoff team ${c.team.abbreviation} (${id}) is not in the ${season} standings`);
    const t: WnbaPlayoffTeam = {
      id,
      abbrev: row?.teamTricode ?? c.team.abbreviation,
      name: row ? `${row.teamCity} ${row.teamName}` : c.team.displayName,
      shortName: row?.teamName ?? c.team.shortDisplayName ?? c.team.name,
      // A null season logo is deliberate (relocated franchise; see standings),
      // so only fall back to the game's logo for teams missing from standings.
      logo: row ? row.logo ?? null : c.team.logo ?? null,
      seed: row?.playoffSeed ?? null,
      conference: row?.conference,
    };
    teamInfo.set(id, t);
    return t;
  };

  interface Draft {
    key: string;
    games: WnbaPlayoffGame[];
    teamIds: [string, string];
    totalCompetitions: number;
    hintedRounds: Set<RoundId>;
  }
  const drafts = new Map<string, Draft>();

  for (const e of events) {
    const comp = e.competitions?.[0];
    const home = comp?.competitors?.find((c: EspnEvent) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c: EspnEvent) => c.homeAway === 'away');
    if (!home || !away) continue;
    teamFrom(home);
    teamFrom(away);
    const ids = [String(home.team.id), String(away.team.id)].sort() as [string, string];
    const key = ids.join('-');
    const status = mapStatus(comp.status?.type ?? {});
    const headline: string = comp.notes?.[0]?.headline ?? '';
    const homeScore = status === 'scheduled' ? null : parseInt(home.score, 10);
    const awayScore = status === 'scheduled' ? null : parseInt(away.score, 10);
    const game: WnbaPlayoffGame = {
      id: String(e.id),
      dateUTC: e.date,
      status,
      statusDetail: comp.status?.type?.detail ?? '',
      homeId: String(home.team.id),
      awayId: String(away.team.id),
      homeScore: Number.isFinite(homeScore) ? homeScore : null,
      awayScore: Number.isFinite(awayScore) ? awayScore : null,
      winnerId: status === 'final' ? (home.winner ? String(home.team.id) : away.winner ? String(away.team.id) : null) : null,
      gameNumber: parseInt(headline.match(/GAME\s+(\d+)/i)?.[1] ?? '', 10) || null,
    };
    const d = drafts.get(key) ?? { key, games: [], teamIds: ids, totalCompetitions: 0, hintedRounds: new Set<RoundId>() };
    d.games.push(game);
    d.totalCompetitions = Math.max(d.totalCompetitions, Number(comp.series?.totalCompetitions) || 0);
    const code = ROUND_CODE[comp.type?.abbreviation ?? ''];
    if (code && format !== 'conference') d.hintedRounds.add(code);
    const fromHeadline = roundFromHeadline(headline, format);
    if (fromHeadline) d.hintedRounds.add(fromHeadline);
    drafts.set(key, d);
  }

  const seriesDrafts = [...drafts.values()];
  for (const d of seriesDrafts) d.games.sort((a, b) => a.dateUTC.localeCompare(b.dateUTC));
  seriesDrafts.sort((a, b) => a.games[0].dateUTC.localeCompare(b.games[0].dateUTC));

  // Each team's series in date order.
  const teamSeries = new Map<string, string[]>();
  for (const d of seriesDrafts) {
    for (const id of d.teamIds) teamSeries.set(id, [...(teamSeries.get(id) ?? []), d.key]);
  }
  const byeOffset = (teamId: string): number => {
    if (format !== 'single-elim') return 0;
    const seed = teamInfo.get(teamId)?.seed;
    if (!seed) {
      issues.push(`No playoff seed for team ${teamId}; can't place byes`);
      return 0;
    }
    return seed <= 2 ? 2 : seed <= 4 ? 1 : 0;
  };

  // Second, seed-free assignment for a finished postseason: the Finals is the
  // last series, and each team's previous series is one round earlier. Every
  // series except the Finals has a winner who played on, so this reaches all
  // of them. It must agree with the forward assignment.
  const backward = new Map<string, number>();
  const lastRound = spec.rounds.length - 1;
  const finalsDraft = seriesDrafts[seriesDrafts.length - 1];
  const seasonDone = !!facts?.champion;
  if (seasonDone && finalsDraft) {
    const visit = (key: string, idx: number) => {
      if (backward.has(key)) return;
      backward.set(key, idx);
      const d = drafts.get(key)!;
      for (const id of d.teamIds) {
        const list = teamSeries.get(id) ?? [];
        const prev = list[list.indexOf(key) - 1];
        if (prev) visit(prev, idx - 1);
      }
    };
    visit(finalsDraft.key, lastRound);
  }

  const rounds = empty().rounds;
  for (const d of seriesDrafts) {
    const indexes = d.teamIds.map((id) => (teamSeries.get(id) ?? []).indexOf(d.key) + byeOffset(id));
    if (indexes[0] !== indexes[1]) {
      issues.push(`Series ${d.key}: teams disagree on the round (${indexes.join(' vs ')})`);
    }
    const idx = Math.max(...indexes);
    if (seasonDone && backward.get(d.key) !== idx) {
      issues.push(`Series ${d.key}: forward round ${idx} but backward round ${backward.get(d.key)}`);
    }
    const roundSpec = spec.rounds[idx];
    if (!roundSpec) {
      issues.push(`Series ${d.key}: round index ${idx} is beyond the ${format} format`);
      continue;
    }
    for (const hinted of d.hintedRounds) {
      if (hinted !== roundSpec.id) issues.push(`Series ${d.key}: placed in ${roundSpec.id} but ESPN labels it ${hinted}`);
    }

    const first = d.games[0];
    const teamA = teamInfo.get(first.homeId)!;
    const teamB = teamInfo.get(first.awayId)!;
    const winsA = d.games.filter((g) => g.winnerId === teamA.id).length;
    const winsB = d.games.filter((g) => g.winnerId === teamB.id).length;
    const bestOf = d.totalCompetitions || roundSpec.defaultBestOf;
    const needed = Math.ceil(bestOf / 2);
    const completed = winsA >= needed || winsB >= needed;
    if (winsA > needed || winsB > needed) issues.push(`Series ${d.key}: ${winsA}-${winsB} exceeds best-of-${bestOf}`);

    rounds[idx].series.push({
      key: d.key,
      round: roundSpec.id,
      ...(format === 'conference' && roundSpec.id !== 'F' ? { conference: teamA.conference } : {}),
      teamA, teamB, winsA, winsB, bestOf, completed,
      winnerId: completed ? (winsA > winsB ? teamA.id : teamB.id) : null,
      games: d.games,
    });
  }

  // A finished postseason must match the format exactly.
  const finals = rounds[rounds.length - 1].series[0];
  if (finals?.completed) {
    for (const r of rounds) {
      if (r.series.length !== r.expected) issues.push(`${r.name}: ${r.series.length} series, expected ${r.expected}`);
      for (const s of r.series) if (!s.completed) issues.push(`${r.name}: ${s.teamA.abbrev}-${s.teamB.abbrev} not completed`);
    }
  }
  // Conference-era rounds list East before West.
  for (const r of rounds) r.series.sort((a, b) => (a.conference ?? '').localeCompare(b.conference ?? ''));

  return { season, format, rounds, issues };
}

/** Champion and runner-up of a completed postseason, with the series score. */
export function wnbaFinalsResult(p: WnbaPlayoffs) {
  const finals = p.rounds.find((r) => r.id === 'F')?.series[0];
  if (!finals?.completed || !finals.winnerId) return null;
  const champion = finals.winnerId === finals.teamA.id ? finals.teamA : finals.teamB;
  const runnerUp = champion === finals.teamA ? finals.teamB : finals.teamA;
  const score = `${Math.max(finals.winsA, finals.winsB)}-${Math.min(finals.winsA, finals.winsB)}`;
  return { champion, runnerUp, score, bestOf: finals.bestOf };
}
