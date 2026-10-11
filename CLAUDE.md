# NBA & WNBA Stats Hub (dkbball.com)

A personal basketball stats site covering two leagues, the NBA and the WNBA:
live scores, standings, playoff brackets, player and team stats, and
championship history. An "NBA | WNBA" switch sits at the top of every page.
Each league has one live season; past seasons are frozen JSON snapshots
served from the repo.

- Live site: https://dkbball.com
- Repo: https://github.com/dhirajkacker/nba-stats-hub
- Hosting: Vercel, auto-deploys every push to `main`. There is no CI, no PR
  flow and no preview gate, so a push to `main` is a production deploy.
  Run `npm run build` before pushing.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- No database and no auth. All data comes from ESPN's free, unofficial public
  APIs (plus a little NBA.com), or from snapshot files in `data/seasons/`.
- `npm run dev` / `npm run build` / `npm run start`.
- `npm run freeze-season -- <YYYY-YY> [--mvp "Name"]` writes an NBA season snapshot.
- `npm run freeze-season -- --league wnba <YYYY> [...]` writes WNBA snapshots
  (validated first; nothing is written if a check fails).

## Leagues

`lib/leagues.ts` is the league registry and the only place that knows where
each league's pages live:

- `LEAGUES.nba` / `LEAGUES.wnba`: label, site name, ESPN slug, `basePath`
  (`''` for NBA, `/wnba` for WNBA), `liveSeason` (null during a WNBA offseason
  with nothing live), `landingSeason`, `knownSeasons`.
- Build every link with `leagueHref` / `seasonPath` / `teamPath`; never write
  `` `/seasons/${...}` `` by hand. NBA URLs keep their original form
  (`/seasons/2026-27/teams/det`); WNBA URLs are `/wnba/seasons/2026/teams/17`.
- **WNBA team URLs use ESPN franchise ids, not tricodes.** WNBA tricodes collide
  with NBA ones (NY, GS, LA, PHX...) and change across eras (NYL/NY, PHO/PHX,
  SAS/SA). Ids persist through relocations: id 17 is San Antonio Silver Stars
  in 2010 and Las Vegas Aces today; id 3 is Tulsa Shock in 2010-15 and Dallas
  Wings from 2016. Team ids also collide across leagues, so key any cache or map
  by league too.
- Client fetches go through `apiUrl(league, path, params)`, which always sends
  `?league=`. API routes validate it and default to `nba`.
- `espnYear(league, season)`: NBA "2026-27" -> 2027; WNBA "2026" -> 2026.
- Client components read the league from `useLeague()` (`LeagueProvider` has no
  default, so a missing provider throws instead of silently rendering NBA).
- Logos and colours: always `teamLogoSrc(league, team)` / `teamColor(league, team)`
  from `lib/team-logos.ts`. The older `getTeamLogoUrl(tricode)` maps tricodes to
  NBA teams, so a WNBA "NY" would show the Knicks logo.
- Theme classes per league live in `lib/theme.ts` (NBA values are the originals).

## Season model (the core design)

`lib/seasons.ts` is the single source of truth:

- `CURRENT_SEASON`: the one live season (e.g. `'2026-27'`).
- `KNOWN_SEASONS`: newest first; drives the season nav and URL validation.
- ESPN identifies a season by its **end year**: `seasonToESPNYear('2026-27') === 2027`.
  Always pass this explicitly to ESPN calls. Never infer the season from
  today's date: around the October rollover the date and `CURRENT_SEASON`
  disagree, which previously broke leaders, standings and team pages.
- Per-season quirks live here too: regular-season end dates and postseason
  anchor dates (2011-12 lockout, 2019-20 bubble, 2020-21 COVID), and
  `seasonHasPlayIn()` (2020-21 onward).

`lib/season-context.ts` is the data router. Every page asks it for a season's
standings, playoffs, leaders or meta:

- Current season: live ESPN fetch.
- Past season: reads `data/seasons/<season>/{standings,playoffs,leaders,meta}.json`.
  If a snapshot file is missing it falls back to reconstructing from ESPN.
- Both paths return the same shapes, so components don't care which they got.
- `meta.frozen` distinguishes archived seasons in the UI. Archived home pages
  show `ChampionHero` instead of live scores.

### NBA season rollover checklist (each October, before opening night)

1. `npm run freeze-season -- <outgoing> --mvp "Finals MVP Name"`. The champion,
   runner-up and Finals score are detected from playoff data; only the MVP is
   manual. Check `meta.json` afterwards.
2. In `lib/seasons.ts`, set `CURRENT_SEASON` to the new season and prepend it to
   `KNOWN_SEASONS`.
3. Add the outgoing champion to `NBA_CHAMPIONS` in `app/history/page.tsx`
   (hardcoded list, newest first; conference finals are in the new snapshot's
   `playoffs.json`).
4. `next.config.ts` redirects import `CURRENT_SEASON`, so they update on build.
5. Build, check the new season home (should show 0-0 standings with a
   "hasn't started" notice) and the newly archived season, then push.

Between the rollover and opening night, the current season legitimately has
no data: standings are all 0-0, leaders are empty (ESPN returns 404 for the
new year), team stats are hidden, and preseason games are excluded everywhere.

### WNBA season model and rollover

- A WNBA season is one calendar year (May-October). Seasons, the live season
  and the landing season are in `lib/wnba/season-list.ts`.
- `lib/wnba/seasons.ts` is a hand-checked table for every covered season:
  teams, games per team, playoff format, seeding scope, champion, runner-up,
  Finals score, Finals MVP, plus `seedOverrides` where ESPN is wrong (2016).
  The freeze script and `scripts/verify/wnba-data.ts` fail if ESPN disagrees.
- Archive: 2010-2025 frozen in `data/wnba/seasons/<YYYY>/`; 2026 live.
- **After the Finals (late Oct/early Nov):**
  1. Add the champion, runner-up, Finals score and Finals MVP to that season's
     row in `lib/wnba/seasons.ts`.
  2. `npm run freeze-season -- --league wnba <YYYY>`.
  3. In `lib/wnba/season-list.ts` set `WNBA_LIVE_SEASON = null` (landing stays on
     the just-finished season through the offseason).
  4. Build, run the checks below, push.
- **When the next season's schedule exists (about April):** add a row to
  `lib/wnba/seasons.ts` (teams, games, format), set `WNBA_LIVE_SEASON` and
  `WNBA_LANDING_SEASON` to it, and prepend it to `WNBA_KNOWN_SEASONS`.

## Routes

NBA season pages live under `app/seasons/[season]/`; WNBA pages mirror them
file for file under `app/wnba/seasons/[season]/` (plus `app/wnba/history`).
Route files are thin shims over shared page bodies in `views/` that take the
league (`PlayerPageView`, `TeamPageView`, `GamePageView`, `PlayersView`,
`TeamsView`); the season home and standings have league-specific views because
their layouts differ (`views/WnbaSeasonHome.tsx`, `views/WnbaStandingsPage.tsx`).
Segment config such as `export const dynamic` must stay written literally in
each route file. Each season layout 404s unknown seasons, renders `SeasonNav`,
and provides the season via `SeasonProvider` / `useSeason()`; `app/wnba/layout.tsx`
provides `LeagueProvider league="wnba"` and the NBA season layout provides
`league="nba"`. The root layout renders `LeagueSwitch` and a league-aware
`Footer` on every page.

| Route | Rendering | Notes |
|---|---|---|
| `/` | static | Redirects to `/seasons/<CURRENT_SEASON>` |
| `/seasons/[season]` | server, dynamic | Live scores (current only), champion hero (archived only), playoff bracket, play-in, standings |
| `/seasons/[season]/standings` | server, dynamic | Full standings |
| `/seasons/[season]/players` | client | Leaders table via `/api/player-stats-leaders`, player search |
| `/seasons/[season]/players/[playerId]` | server, dynamic | Bio is current; season averages and game log are for the URL's season |
| `/seasons/[season]/teams` | client | Standings-based team table via `/api/standings` |
| `/seasons/[season]/teams/[teamId]` | server, dynamic | Record, season team stats, roster (current season only), last 10 games incl. playoffs |
| `/seasons/[season]/games/[gameId]` | client | Box score via `/api/game/[gameId]` |
| `/history` | static | Hardcoded champions list 1947 onward |

Old season-less URLs (`/teams`, `/players/:id`, `/standings`, ...) redirect to
the current season in `next.config.ts` (307, so the target can move each year).

API routes in `app/api/`: `scores` (live scoreboard, polled every 30s by
`LiveScores`), `standings`, `player-stats-leaders`, `player-stats`,
`players/search`, `game/[gameId]`. Most accept `?season=` and default to
`CURRENT_SEASON`.

## Data sources and modules

- `lib/espn-api.ts`: scoreboard and standings. ESPN's `/standings` endpoint
  returns no entries, so standings are built by walking the scoreboard
  backwards and taking each team's record from its latest regular-season
  (type 2) game. `getESPNStandingsBySeason(endDate, espnYear)` filters to that
  season's games, stops at Oct 1 of the start year, and fills unplayed teams
  at 0-0.
- `lib/playoffs-api.ts`: scans scoreboard days around an anchor date for
  postseason (type 3) and play-in (type 5) games and assembles series. Pass
  `seasonYear` to ignore other seasons.
- `lib/espn-stats-leaders.ts`: league leaders from ESPN's core API
  (`seasons/<year>/types/2/leaders`), with a teams/rosters fallback. A 404
  means "no data for that season yet": no retry, no fallback, and the API
  route returns `[]` with `X-Season-Status: not-started`.
- `lib/espn-team-stats.ts`: team stats and schedule take `?season=<year>`.
  The roster endpoint only serves the current roster, so archived team pages
  omit it.
- `lib/espn-players.ts`: player bio, per-season averages
  (`getPlayerSeasonStats`, core API), and game log (`?season=<year>`,
  preseason excluded).
- `lib/nba-api.ts`, `lib/nba-leaders.ts`: older NBA.com wrappers, still used by
  the `scores` and `player-stats` API routes.
- `lib/team-identifiers.ts`, `lib/team-logos.ts`: tricode normalization and
  logos and colors. ESPN uses non-standard tricodes (`NY`, `GS`, `SA`, `NO`,
  `UTAH`, `WSH`); snapshots store ESPN's codes, and `meta.json` stores standard
  ones (`NYK`, `SAS`).

## WNBA data layer (`lib/wnba/`)

Built only from season-specific ESPN data. Lessons baked in:

- `standings.ts`: ESPN's v2 standings (`apis/v2/.../wnba/standings?season=Y`,
  `level=1` league table with official `playoffSeed`, `level=2` conference
  groups). ESPN's response doesn't say which season it returned (and returns
  the current season for 1997-2001), so validate with team counts and win/loss
  totals. A relocated franchise's old seasons get the current team's logo from
  ESPN, so when the season's team name differs from the franchise's current
  name the logo is dropped and pages show an initials badge.
- `playoffs.ts`: groups postseason games into series by team pair and assigns
  rounds from structure (each team's series in date order, plus seed-based
  byes in 2016-21), cross-checked by a seed-free pass backwards from the Finals
  and against ESPN round codes (RD16/QTR/SEMI/FINAL, from ~2019) and headlines
  (inconsistent before ~2019). Disagreements go into `issues`. Formats:
  conference (2010-15), single-elim with byes (2016-21), eight-team (2022+).
  ESPN's postseason window can start a day late (2017), so the scan starts early.
- `leaders.ts` / `player-team.ts`: a player's team for a season comes from their
  season game log (last regular-season or playoff game). ESPN's leader entries
  and season-athlete records point at the player's *latest* team.
- `season-context.ts`: live season from ESPN, archived seasons from snapshots;
  a live season reports its champion as soon as the Finals end.
- `espn.ts`: retries, 404 = null, concurrency cap, optional disk cache
  (`ESPN_CACHE_DIR`, set by the scripts to `.cache/espn`).
- ESPN has no headshots for many retired WNBA players; pages show an initials
  avatar. Only ever use the headshot URL ESPN returns.
- WNBA history (`lib/wnba/champions.ts`): 2010+ from the season table; 1997-2009
  hand-entered and checked against two sources (ESPN's pre-2010 data is incomplete).

## Verification scripts (`scripts/verify/`)

- `snapshot-pages.ts`: snapshot key NBA pages/APIs and diff against a baseline
  (`snapshot <base> <dir>`, `diff <dirA[,dirA2]> <dirB>`). Use it to prove an
  NBA-facing refactor changes nothing. The league switch is ignored.
- `serve.sh [port]`: start `next start`, replacing whatever holds the port, and
  confirm it serves the current build id (a stale server once made a diff
  meaningless).
- `wnba-data.ts [seasons]`: validate WNBA data against the season table
  (`SNAPSHOTS=1` checks the committed snapshots).
- `crawl.ts <base>`: crawl both leagues (Chrome-rendering client pages), check
  links resolve, no cross-league links or images, WNBA team links are franchise
  ids in that season, every image loads, wrong-league URLs are not-found.

## Snapshots (`data/seasons/<season>/`, `data/wnba/seasons/<YYYY>/`)

Written only by the freeze scripts; treat them as generated, and re-run the
script rather than hand-editing (except adding `finalsMVP` in an NBA
`meta.json`). Archived NBA seasons: 2010-11 through 2025-26. Archived WNBA
seasons: 2010-2025 (WNBA `playoffs.json` uses the `WnbaPlayoffs` shape with
rounds; standings rows carry `logo`, `playoffSeed`, `leagueRank`).

- `standings.json`: final regular-season standings (`Standings` type).
- `playoffs.json`: `{ playIn, series[] }` with every game.
- `leaders.json`: top 25 scorers with per-game stats.
- `meta.json`: champion, runner-up, Finals score, Finals MVP, `frozen`, `frozenAt`.

## UI conventions

- Tailwind with an orange/gray gradient theme; section headers use a small
  orange gradient bar followed by a heavy `h2`.
- Key components: `StandingsTable` (play-in color coding only when
  `seasonHasPlayIn`), `PlayoffBracket`, `PlayInBracket`, `ChampionHero`,
  `LiveScores`, `SeasonNav`, `PreseasonNotice`.
- Images come from `a.espncdn.com` (allowed in `next.config.ts`).

## Known limitations

- The layout overflows horizontally at phone widths (~420px) on both leagues'
  pages (headers, nav, brackets).
- NBA archived leaders show the player's current team (same ESPN quirk the WNBA
  code works around with season game logs).

- Standings ties are broken by city name, not NBA tiebreak rules, so playoff
  seed labels can be off for tied teams.
- The players and teams list pages render client-side and show a loading
  state until their API call returns.
- The `history` list is maintained by hand.
