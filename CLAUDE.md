# NBA Stats Hub (dkbball.com)

A personal NBA stats site: live scores, standings, playoff brackets, player and
team stats, and championship history. One "current" season is live; past
seasons are frozen JSON snapshots served from the repo.

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
- `npm run freeze-season -- <YYYY-YY> [--mvp "Name"]` writes a season snapshot.

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

### Season rollover checklist (each October, before opening night)

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

## Routes

All season-scoped pages live under `app/seasons/[season]/`. The season layout
404s unknown seasons, renders `SeasonNav`, and provides the season via
`SeasonProvider` / `useSeason()`.

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

## Snapshots (`data/seasons/<season>/`)

Written only by `scripts/freeze-season.ts`; treat them as generated, and
re-run the script rather than hand-editing (except adding `finalsMVP` in
`meta.json`). Archived seasons: 2010-11 through 2025-26.

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

- Standings ties are broken by city name, not NBA tiebreak rules, so playoff
  seed labels can be off for tied teams.
- The players and teams list pages render client-side and show a loading
  state until their API call returns.
- The `history` list is maintained by hand.
