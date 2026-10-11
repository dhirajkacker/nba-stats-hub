// League registry: the one place that knows which leagues exist, where their
// pages live, and which seasons each one has.
//
// Relative imports only. next.config.ts and scripts/ import this file, and
// neither resolves the "@/" alias.

import { CURRENT_SEASON, KNOWN_SEASONS, seasonToESPNYear } from './seasons';
import { WNBA_LIVE_SEASON, WNBA_LANDING_SEASON, WNBA_KNOWN_SEASONS } from './wnba/season-list';

export type LeagueId = 'nba' | 'wnba';

export const LEAGUE_IDS: readonly LeagueId[] = ['nba', 'wnba'];

export interface LeagueInfo {
  id: LeagueId;
  /** Short display name: "NBA" / "WNBA". */
  label: string;
  /** Site name used in titles and the nav brand. */
  siteName: string;
  /** Path segment in ESPN API URLs. */
  espnSlug: 'nba' | 'wnba';
  /** URL prefix for this league's pages. NBA pages keep their original paths. */
  basePath: '' | '/wnba';
  /** The season with live data, or null during an offseason with nothing live. */
  liveSeason: string | null;
  /** Where the league's home link lands. */
  landingSeason: string;
  /** Newest first. Drives the season nav and URL validation. */
  knownSeasons: readonly string[];
}

export const LEAGUES: Record<LeagueId, LeagueInfo> = {
  nba: {
    id: 'nba',
    label: 'NBA',
    siteName: 'NBA Stats Hub',
    espnSlug: 'nba',
    basePath: '',
    liveSeason: CURRENT_SEASON,
    landingSeason: CURRENT_SEASON,
    knownSeasons: KNOWN_SEASONS,
  },
  wnba: {
    id: 'wnba',
    label: 'WNBA',
    siteName: 'WNBA Stats Hub',
    espnSlug: 'wnba',
    basePath: '/wnba',
    liveSeason: WNBA_LIVE_SEASON,
    landingSeason: WNBA_LANDING_SEASON,
    knownSeasons: WNBA_KNOWN_SEASONS,
  },
};

export function isLeagueId(value: string | null | undefined): value is LeagueId {
  return value === 'nba' || value === 'wnba';
}

export function leagueInfo(league: LeagueId): LeagueInfo {
  return LEAGUES[league];
}

/** Prefix a site path with the league's base path. NBA paths are unchanged. */
export function leagueHref(league: LeagueId, path: string): string {
  return LEAGUES[league].basePath + path;
}

export function seasonPath(league: LeagueId, season: string, sub = ''): string {
  return leagueHref(league, `/seasons/${season}${sub}`);
}

/**
 * Link to a team page. NBA team URLs use the lowercased tricode (existing
 * URLs). WNBA team URLs use the ESPN franchise id, because WNBA tricodes
 * collide with NBA ones and change across eras (NYL vs NY, SAS vs LV).
 */
export function teamPath(
  league: LeagueId,
  season: string,
  team: { abbrev?: string; id?: string | number },
): string {
  const key = league === 'wnba' ? String(team.id ?? '') : String(team.abbrev ?? '').toLowerCase();
  return seasonPath(league, season, `/teams/${key}`);
}

export function isKnownLeagueSeason(league: LeagueId, season: string): boolean {
  return LEAGUES[league].knownSeasons.includes(season);
}

export function isLiveSeason(league: LeagueId, season: string): boolean {
  return LEAGUES[league].liveSeason === season;
}

/**
 * ESPN's season year. NBA seasons are named by start year ("2026-27") but ESPN
 * uses the end year (2027). WNBA seasons are a single year and ESPN uses it as is.
 */
export function espnYear(league: LeagueId, season: string): number {
  return league === 'nba' ? seasonToESPNYear(season) : parseInt(season, 10);
}

/**
 * URL for one of this site's API routes. Always carries the league, so a
 * WNBA page can never silently receive NBA data from a defaulted parameter.
 */
export function apiUrl(
  league: LeagueId,
  path: string,
  params: Record<string, string | number | undefined> = {},
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  qs.set('league', league);
  return `${path}?${qs.toString()}`;
}

/** Read and validate ?league= on an API route. Missing means NBA. */
export function leagueFromParam(value: string | null): LeagueId | null {
  if (value === null || value === '') return 'nba';
  return isLeagueId(value) ? value : null;
}

const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports/basketball';
const ESPN_COMMON = 'https://site.api.espn.com/apis/common/v3/sports/basketball';
const ESPN_WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball';
const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues';

/** ESPN base URLs for one league. */
export function espnUrls(league: LeagueId) {
  const slug = LEAGUES[league].espnSlug;
  return {
    site: `${ESPN_SITE}/${slug}`,
    common: `${ESPN_COMMON}/${slug}`,
    web: `${ESPN_WEB}/${slug}`,
    core: `${ESPN_CORE}/${slug}`,
  };
}

/** Which league a site path belongs to. */
export function leagueFromPath(pathname: string): LeagueId {
  return pathname === '/wnba' || pathname.startsWith('/wnba/') ? 'wnba' : 'nba';
}

/**
 * Where the league switch should send someone viewing `pathname`. Section
 * pages (standings, players, teams, history) map to the same section of the
 * other league's landing season. Team, player and game pages map to the other
 * league's home, because ids and seasons don't carry across leagues.
 */
export function switchLeagueHref(pathname: string, target: LeagueId): string {
  const from = leagueFromPath(pathname);
  const rest = from === 'wnba' ? pathname.slice('/wnba'.length) || '/' : pathname;
  const landing = LEAGUES[target].landingSeason;
  if (rest === '/history') return leagueHref(target, '/history');
  const section = rest.match(/^\/seasons\/[^/]+\/(standings|players|teams)\/?$/)?.[1];
  if (section) return seasonPath(target, landing, `/${section}`);
  return seasonPath(target, landing);
}
