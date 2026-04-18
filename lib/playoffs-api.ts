// Playoffs (play-in + bracket) data fetching + parsing from ESPN scoreboard.
// We fetch a wide date window, bucket events by season.type, and derive
// structured play-in and playoff series objects.

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

export type Conference = 'East' | 'West';
export type PlayInSlot = '7v8' | '9v10' | '8seed';
export type PlayoffRound = '1st Round' | 'Conference Semis' | 'Conference Finals' | 'NBA Finals';

export interface SimpleTeam {
  id: string;
  abbrev: string;
  displayName: string;
  logo: string;
  score: number;
  seed?: number;
}

export interface PlayoffGame {
  id: string;
  dateUTC: string;
  status: 'scheduled' | 'live' | 'final';
  statusDetail: string;
  gameNumber?: number;
  away: SimpleTeam;
  home: SimpleTeam;
}

export interface PlayInGame extends PlayoffGame {
  conference: Conference;
  slot: PlayInSlot;
}

export interface PlayInData {
  east: Partial<Record<PlayInSlot, PlayInGame>>;
  west: Partial<Record<PlayInSlot, PlayInGame>>;
}

export interface PlayoffSeries {
  key: string; // stable id: `${round}:${teamA}-${teamB}`
  round: PlayoffRound;
  conference: Conference | 'Finals';
  teamA: SimpleTeam; // higher seed or home of game 1
  teamB: SimpleTeam;
  winsA: number;
  winsB: number;
  completed: boolean;
  summary: string; // e.g. "BOS leads series 2-1"
  games: PlayoffGame[]; // chronological
}

export interface PlayoffsData {
  playIn: PlayInData | null;
  series: PlayoffSeries[];
}

function mapStatus(state: string, completed: boolean): PlayoffGame['status'] {
  if (completed) return 'final';
  if (state === 'in') return 'live';
  return 'scheduled';
}

function toTeam(c: any): SimpleTeam {
  const t = c.team || {};
  return {
    id: String(t.id ?? ''),
    abbrev: t.abbreviation ?? '',
    displayName: t.displayName ?? t.name ?? '',
    logo: t.logo ?? '',
    score: parseInt(c.score) || 0,
    seed: c.curatedRank?.current ? parseInt(c.curatedRank.current) : undefined,
  };
}

function parsePlayInSlot(headline: string): { conference: Conference; slot: PlayInSlot } | null {
  // Examples:
  //  "NBA Play-In - East - 7th Place vs 8th Place"
  //  "NBA Play-In - West - 9th Place vs 10th Place"
  //  "NBA Play-In - East - 8th Seed Game"
  const conference: Conference | null = /\bEast\b/i.test(headline)
    ? 'East'
    : /\bWest\b/i.test(headline)
      ? 'West'
      : null;
  if (!conference) return null;

  let slot: PlayInSlot | null = null;
  if (/7th.*8th/i.test(headline)) slot = '7v8';
  else if (/9th.*10th/i.test(headline)) slot = '9v10';
  else if (/8th Seed/i.test(headline)) slot = '8seed';

  if (!slot) return null;
  return { conference, slot };
}

function parsePlayoffHeadline(headline: string): { conference: Conference | 'Finals'; round: PlayoffRound; gameNumber?: number } | null {
  // "East 1st Round - Game 3", "West Conference Finals - Game 5", "NBA Finals - Game 2"
  const gameMatch = headline.match(/Game\s+(\d+)/i);
  const gameNumber = gameMatch ? parseInt(gameMatch[1]) : undefined;

  if (/NBA Finals/i.test(headline)) {
    return { conference: 'Finals', round: 'NBA Finals', gameNumber };
  }
  const conf: Conference | null = /\bEast\b/i.test(headline)
    ? 'East'
    : /\bWest\b/i.test(headline)
      ? 'West'
      : null;
  if (!conf) return null;

  let round: PlayoffRound | null = null;
  if (/1st Round|First Round/i.test(headline)) round = '1st Round';
  else if (/Conference Semis|Conference Semifinals|Semifinals/i.test(headline)) round = 'Conference Semis';
  else if (/Conference Finals/i.test(headline)) round = 'Conference Finals';

  if (!round) return null;
  return { conference: conf, round, gameNumber };
}

function toYYYYMMDD(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function fetchDay(dateStr: string): Promise<any[]> {
  try {
    const url = `${ESPN_BASE_URL}/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export async function getPlayoffsData(daysBack = 10, daysForward = 14): Promise<PlayoffsData> {
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const dates: string[] = [];
  for (let i = -daysBack; i <= daysForward; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(toYYYYMMDD(d));
  }

  const all = await Promise.all(dates.map(fetchDay));
  const events = all.flat();

  const playInByConf: PlayInData = { east: {}, west: {} };
  const seriesMap = new Map<string, PlayoffSeries>();
  let anyPlayIn = false;

  for (const event of events) {
    const seasonType = event.season?.type;
    if (seasonType !== 3 && seasonType !== 5) continue;

    const comp = event.competitions?.[0];
    if (!comp) continue;
    const headline: string = comp.notes?.[0]?.headline || '';
    const statusType = comp.status?.type || {};
    const status = mapStatus(statusType.state || '', !!statusType.completed);

    const competitors = comp.competitors || [];
    const awayC = competitors.find((c: any) => c.homeAway === 'away');
    const homeC = competitors.find((c: any) => c.homeAway === 'home');
    if (!awayC || !homeC) continue;

    const away = toTeam(awayC);
    const home = toTeam(homeC);

    const baseGame: PlayoffGame = {
      id: String(event.id),
      dateUTC: event.date,
      status,
      statusDetail: statusType.detail || statusType.description || '',
      away,
      home,
    };

    if (seasonType === 5) {
      const parsed = parsePlayInSlot(headline);
      if (!parsed) continue;
      anyPlayIn = true;
      const g: PlayInGame = { ...baseGame, conference: parsed.conference, slot: parsed.slot };
      const bucket = parsed.conference === 'East' ? playInByConf.east : playInByConf.west;
      bucket[parsed.slot] = g;
      continue;
    }

    // seasonType === 3: playoffs
    const parsed = parsePlayoffHeadline(headline);
    if (!parsed) continue;

    // Stable series key: round + sorted team abbreviations
    const abbrs = [away.abbrev, home.abbrev].sort();
    const key = `${parsed.round}:${abbrs.join('-')}`;
    baseGame.gameNumber = parsed.gameNumber;

    let series = seriesMap.get(key);
    if (!series) {
      // Seed teamA/teamB by sort order so rendering is stable
      const [abbrevA] = abbrs;
      const teamA = away.abbrev === abbrevA ? away : home;
      const teamB = away.abbrev === abbrevA ? home : away;
      series = {
        key,
        round: parsed.round,
        conference: parsed.conference,
        teamA: { ...teamA, score: 0 },
        teamB: { ...teamB, score: 0 },
        winsA: 0,
        winsB: 0,
        completed: false,
        summary: '',
        games: [],
      };
      seriesMap.set(key, series);
    }
    series.games.push(baseGame);

    // Track the preferred logo/seed from any game
    if (!series.teamA.logo && series.teamA.abbrev === away.abbrev) series.teamA.logo = away.logo;
    if (!series.teamB.logo && series.teamB.abbrev === home.abbrev) series.teamB.logo = home.logo;

    // Prefer structured series data from ESPN when available
    const espnSeries = comp.series;
    if (espnSeries?.competitors?.length === 2) {
      // competitors are listed in same order as competition.competitors (usually away first)
      const [c0, c1] = espnSeries.competitors;
      const c0Abbrev = awayC.team?.abbreviation;
      if (c0Abbrev === series.teamA.abbrev) {
        series.winsA = Math.max(series.winsA, parseInt(c0.wins) || 0);
        series.winsB = Math.max(series.winsB, parseInt(c1.wins) || 0);
      } else {
        series.winsA = Math.max(series.winsA, parseInt(c1.wins) || 0);
        series.winsB = Math.max(series.winsB, parseInt(c0.wins) || 0);
      }
      series.completed = !!espnSeries.completed || series.completed;
      if (espnSeries.summary) series.summary = espnSeries.summary;
    }
  }

  // Sort each series' games chronologically
  for (const s of seriesMap.values()) {
    s.games.sort((a, b) => a.dateUTC.localeCompare(b.dateUTC));
    // Fallback: derive wins by counting final games if ESPN structured data missing
    if (!s.summary) {
      let wA = 0, wB = 0;
      for (const g of s.games) {
        if (g.status !== 'final') continue;
        const aScore = g.away.abbrev === s.teamA.abbrev ? g.away.score : g.home.score;
        const bScore = g.away.abbrev === s.teamA.abbrev ? g.home.score : g.away.score;
        if (aScore > bScore) wA++; else if (bScore > aScore) wB++;
      }
      s.winsA = wA;
      s.winsB = wB;
      if (wA === 4 || wB === 4) s.completed = true;
      s.summary = wA === wB
        ? `Series tied ${wA}-${wB}`
        : `${wA > wB ? s.teamA.abbrev : s.teamB.abbrev} leads series ${Math.max(wA, wB)}-${Math.min(wA, wB)}`;
    }
  }

  const roundOrder: PlayoffRound[] = ['1st Round', 'Conference Semis', 'Conference Finals', 'NBA Finals'];
  const series = Array.from(seriesMap.values()).sort((a, b) => {
    const r = roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
    if (r !== 0) return r;
    if (a.conference !== b.conference) return a.conference.localeCompare(b.conference);
    return a.key.localeCompare(b.key);
  });

  return {
    playIn: anyPlayIn ? playInByConf : null,
    series,
  };
}
