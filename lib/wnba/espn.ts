// Low-level ESPN access for the WNBA data layer.
//
// - Retries transient failures with backoff; a 404 returns null at once.
// - Caps concurrent requests so freezing many seasons doesn't hammer ESPN.
// - When ESPN_CACHE_DIR is set (the freeze script sets it), raw responses are
//   cached on disk, so re-running after a parser fix doesn't re-fetch.
//
// Relative imports only (used by scripts/ as well as the app).

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { espnUrls } from '../leagues';

export const WNBA = espnUrls('wnba');
export const WNBA_STANDINGS_V2 = 'https://site.api.espn.com/apis/v2/sports/basketball/wnba/standings';

const MAX_CONCURRENT = 6;
let active = 0;
const waiting: Array<() => void> = [];

async function acquire() {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
}

function release() {
  active--;
  waiting.shift()?.();
}

/** ESPN's core API hands out http:// refs; fetch them over https. */
export function httpsRef(ref: string): string {
  return ref.replace(/^http:\/\//, 'https://');
}

async function readCache(url: string): Promise<{ hit: boolean; value: unknown }> {
  const dir = process.env.ESPN_CACHE_DIR;
  if (!dir) return { hit: false, value: null };
  const file = path.join(dir, createHash('sha1').update(url).digest('hex') + '.json');
  try {
    return { hit: true, value: JSON.parse(await fs.readFile(file, 'utf-8')) };
  } catch {
    return { hit: false, value: null };
  }
}

async function writeCache(url: string, value: unknown) {
  const dir = process.env.ESPN_CACHE_DIR;
  if (!dir) return;
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, createHash('sha1').update(url).digest('hex') + '.json');
  await fs.writeFile(file, JSON.stringify(value));
}

/**
 * GET an ESPN JSON resource. Returns null for 404 or after repeated failures.
 * `revalidate` is the Next.js data-cache lifetime in seconds.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function espnJson<T = any>(url: string, revalidate = 600): Promise<T | null> {
  const cached = await readCache(url);
  if (cached.hit) return cached.value as T | null;

  await acquire();
  try {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fetch(url, {
          next: { revalidate },
          signal: AbortSignal.timeout(15_000),
          headers: { Accept: 'application/json' },
        } as RequestInit);
        if (res.status === 404) {
          await writeCache(url, null);
          return null;
        }
        if (res.ok) {
          const json = (await res.json()) as T;
          await writeCache(url, json);
          return json;
        }
      } catch {
        // network error or timeout; retry below
      }
      await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    }
    console.error(`[wnba] giving up on ${url}`);
    return null;
  } finally {
    release();
  }
}

export interface SeasonWindow {
  regularStart: string; // ISO date YYYY-MM-DD
  regularEnd: string;
  postStart: string;
  postEnd: string;
}

/** Exact regular-season and postseason dates for a WNBA season, from ESPN's core API. */
export async function getWnbaSeasonWindow(year: number): Promise<SeasonWindow | null> {
  const [reg, post] = await Promise.all([
    espnJson(`${WNBA.core}/seasons/${year}/types/2`, 86400),
    espnJson(`${WNBA.core}/seasons/${year}/types/3`, 86400),
  ]);
  if (!reg?.startDate || !post?.startDate) return null;
  return {
    regularStart: String(reg.startDate).slice(0, 10),
    regularEnd: String(reg.endDate).slice(0, 10),
    postStart: String(post.startDate).slice(0, 10),
    postEnd: String(post.endDate).slice(0, 10),
  };
}

/** Every date (YYYYMMDD) from start to end inclusive. */
export function datesBetween(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const d = new Date(`${startIso}T12:00:00Z`);
  const end = new Date(`${endIso}T12:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWnbaScoreboardDay(yyyymmdd: string, revalidate = 600): Promise<any[]> {
  const data = await espnJson(`${WNBA.site}/scoreboard?dates=${yyyymmdd}`, revalidate);
  return data?.events ?? [];
}
