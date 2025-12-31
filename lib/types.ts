// NBA Data Types

export interface Team {
  teamId: number;
  teamName: string;
  teamTricode: string;
  teamCity: string;
  wins: number;
  losses: number;
  winPct: number;
  conference: 'East' | 'West';
  confRank: number;
}

export interface GameStatus {
  status: number; // 1 = scheduled, 2 = live, 3 = finished
  statusText: string;
  period: number;
  gameClock: string;
  displayClock: string;
}

export interface TeamScore {
  teamId: number;
  teamName: string;
  teamTricode: string;
  teamCity: string;
  score: number;
  inBonus: boolean;
  timeoutsRemaining: number;
}

export interface Game {
  gameId: string;
  gameCode: string;
  gameStatus: GameStatus;
  gameStatusText: string;
  gameTimeUTC: string;
  gameEt: string;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  period: number;
  gameClock: string;
  regulationPeriods: number;
}

export interface Scoreboard {
  gameDate: string;
  games: Game[];
}

export interface Standing {
  teamId: number;
  teamCity: string;
  teamName: string;
  teamTricode: string;
  conference: 'East' | 'West';
  confRank: number;
  wins: number;
  losses: number;
  winPct: number;
  gamesBehind: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  confWins: number;
  confLosses: number;
  lastTenWins: number;
  lastTenLosses: number;
  streak: string;
}

export interface Standings {
  season: string;
  seasonType: string;
  standings: Standing[];
}

export interface PlayerStats {
  playerId: number;
  playerName: string;
  teamId: number;
  teamTricode: string;
  games: number;
  gamesStarted: number;
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPct: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointerPct: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPct: number;
  plusMinus: number;
}

export interface TeamStats {
  teamId: number;
  teamName: string;
  teamTricode: string;
  games: number;
  wins: number;
  losses: number;
  winPct: number;
  minutes: number;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPct: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointerPct: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPct: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fouls: number;
  plusMinus: number;
}

export interface GameLog {
  gameId: string;
  gameDate: string;
  matchup: string;
  result: 'W' | 'L';
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPct: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointerPct: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPct: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
}

export interface Player {
  playerId: number;
  playerName: string;
  playerSlug: string;
  teamId: number;
  teamName: string;
  teamTricode: string;
  jerseyNum: string;
  position: string;
  height: string;
  weight: string;
  country: string;
  college: string;
  draftYear: string;
  draftRound: string;
  draftNumber: string;
}
