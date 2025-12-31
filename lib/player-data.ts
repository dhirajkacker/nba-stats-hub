// Static player data - In a real app, this would come from an API
// This is a sample of popular NBA players for demonstration

export interface PlayerInfo {
  id: number;
  name: string;
  teamTricode: string;
  position: string;
  jerseyNumber: string;
  height: string;
  weight: string;
  ppg?: number;
  rpg?: number;
  apg?: number;
  fgm?: number;    // Field goals made per game
  fga?: number;    // Field goals attempted per game
  fgPct?: number;  // Field goal percentage
  fg3m?: number;   // 3-pointers made per game
  fg3a?: number;   // 3-pointers attempted per game
  fg3Pct?: number; // 3-point percentage
  ftm?: number;    // Free throws made per game
  fta?: number;    // Free throws attempted per game
  ftPct?: number;  // Free throw percentage
  mpg?: number;    // Minutes per game
}

export const POPULAR_PLAYERS: PlayerInfo[] = [
  { id: 1966, name: 'LeBron James', teamTricode: 'LAL', position: 'F', jerseyNumber: '23', height: '6-9', weight: '250', ppg: 25.2, rpg: 7.9, apg: 8.1, fgm: 9.2, fga: 18.5, fgPct: 49.8, fg3m: 2.1, fg3a: 6.2, fg3Pct: 33.9, ftm: 4.7, fta: 6.5, ftPct: 72.3, mpg: 35.3 },
  { id: 3975, name: 'Stephen Curry', teamTricode: 'GSW', position: 'G', jerseyNumber: '30', height: '6-2', weight: '185', ppg: 27.5, rpg: 4.5, apg: 6.3, fgm: 9.4, fga: 20.1, fgPct: 46.8, fg3m: 5.0, fg3a: 12.7, fg3Pct: 39.4, ftm: 3.7, fta: 4.1, ftPct: 90.2, mpg: 34.7 },
  { id: 3202, name: 'Kevin Durant', teamTricode: 'PHX', position: 'F', jerseyNumber: '35', height: '6-10', weight: '240', ppg: 28.1, rpg: 6.7, apg: 5.0, fgm: 10.3, fga: 19.8, fgPct: 52.0, fg3m: 2.2, fg3a: 5.8, fg3Pct: 37.9, ftm: 5.3, fta: 6.0, ftPct: 88.3, mpg: 36.9 },
  { id: 3032977, name: 'Giannis Antetokounmpo', teamTricode: 'MIL', position: 'F', jerseyNumber: '34', height: '6-11', weight: '242', ppg: 31.2, rpg: 11.9, apg: 5.7, fgm: 12.1, fga: 20.6, fgPct: 58.7, fg3m: 0.6, fg3a: 2.3, fg3Pct: 26.1, ftm: 6.4, fta: 10.1, ftPct: 63.4, mpg: 35.0 },
  { id: 3945274, name: 'Luka Dončić', teamTricode: 'LAL', position: 'G', jerseyNumber: '77', height: '6-7', weight: '230', ppg: 33.7, rpg: 8.9, apg: 9.5, fgm: 11.2, fga: 23.5, fgPct: 47.7, fg3m: 3.8, fg3a: 10.3, fg3Pct: 36.9, ftm: 6.9, fta: 8.6, ftPct: 80.2, mpg: 37.4 },
  { id: 3059318, name: 'Joel Embiid', teamTricode: 'PHI', position: 'C', jerseyNumber: '21', height: '7-0', weight: '280', ppg: 34.7, rpg: 11.0, apg: 5.6, fgm: 11.0, fga: 20.1, fgPct: 54.7, fg3m: 1.4, fg3a: 4.4, fg3Pct: 31.8, ftm: 11.3, fta: 13.0, ftPct: 86.9, mpg: 34.6 },
  { id: 3112335, name: 'Nikola Jokić', teamTricode: 'DEN', position: 'C', jerseyNumber: '15', height: '6-11', weight: '284', ppg: 26.4, rpg: 12.4, apg: 9.0, fgm: 9.9, fga: 17.4, fgPct: 56.9, fg3m: 1.2, fg3a: 3.7, fg3Pct: 32.4, ftm: 5.4, fta: 6.5, ftPct: 83.1, mpg: 34.6 },
  { id: 4065648, name: 'Jayson Tatum', teamTricode: 'BOS', position: 'F', jerseyNumber: '0', height: '6-8', weight: '210', ppg: 27.0, rpg: 8.4, apg: 4.9, fgm: 9.5, fga: 21.1, fgPct: 45.0, fg3m: 3.1, fg3a: 8.9, fg3Pct: 34.8, ftm: 4.9, fta: 5.9, ftPct: 83.1, mpg: 36.9 },
  { id: 4279888, name: 'Ja Morant', teamTricode: 'MEM', position: 'G', jerseyNumber: '12', height: '6-3', weight: '174', ppg: 25.1, rpg: 5.6, apg: 8.1, fgm: 9.2, fga: 19.8, fgPct: 46.5, fg3m: 1.4, fg3a: 4.4, fg3Pct: 31.8, ftm: 5.3, fta: 7.0, ftPct: 75.7, mpg: 32.8 },
  { id: 4431678, name: 'Anthony Edwards', teamTricode: 'MIN', position: 'G', jerseyNumber: '5', height: '6-4', weight: '225', ppg: 25.9, rpg: 5.4, apg: 5.1, fgm: 9.1, fga: 20.5, fgPct: 44.4, fg3m: 3.0, fg3a: 8.9, fg3Pct: 33.7, ftm: 4.7, fta: 6.1, ftPct: 77.0, mpg: 35.8 },
  { id: 3917376, name: 'Jaylen Brown', teamTricode: 'BOS', position: 'G', jerseyNumber: '7', height: '6-6', weight: '223', ppg: 23.0, rpg: 5.5, apg: 3.6, fgm: 8.4, fga: 17.8, fgPct: 47.2, fg3m: 2.4, fg3a: 6.5, fg3Pct: 36.9, ftm: 3.8, fta: 4.9, ftPct: 77.6, mpg: 33.9 },
  { id: 6606, name: 'Damian Lillard', teamTricode: 'MIL', position: 'G', jerseyNumber: '0', height: '6-2', weight: '195', ppg: 25.0, rpg: 4.2, apg: 7.0, fgm: 8.3, fga: 18.2, fgPct: 45.6, fg3m: 4.2, fg3a: 10.6, fg3Pct: 39.6, ftm: 4.2, fta: 4.8, ftPct: 87.5, mpg: 35.3 },
  { id: 4278073, name: 'Shai Gilgeous-Alexander', teamTricode: 'OKC', position: 'G', jerseyNumber: '2', height: '6-6', weight: '195', ppg: 30.1, rpg: 5.5, apg: 6.2, fgm: 10.8, fga: 20.3, fgPct: 53.2, fg3m: 1.3, fg3a: 4.2, fg3Pct: 31.0, ftm: 7.2, fta: 8.2, ftPct: 87.8, mpg: 34.0 },
  { id: 3136776, name: 'Karl-Anthony Towns', teamTricode: 'NYK', position: 'C', jerseyNumber: '32', height: '7-0', weight: '248', ppg: 20.9, rpg: 9.3, apg: 3.2, fgm: 7.6, fga: 14.5, fgPct: 52.4, fg3m: 2.5, fg3a: 6.1, fg3Pct: 41.0, ftm: 3.2, fta: 3.6, ftPct: 88.9, mpg: 33.4 },
  { id: 3147657, name: 'Rudy Gobert', teamTricode: 'MIN', position: 'C', jerseyNumber: '27', height: '7-1', weight: '258', ppg: 13.7, rpg: 12.3, apg: 2.1, fgm: 6.0, fga: 8.9, fgPct: 67.4, fg3m: 0.0, fg3a: 0.1, fg3Pct: 0.0, ftm: 1.7, fta: 2.8, ftPct: 60.7, mpg: 31.2 },
  { id: 4277905, name: 'Trae Young', teamTricode: 'ATL', position: 'G', jerseyNumber: '11', height: '6-1', weight: '164', ppg: 26.4, rpg: 2.8, apg: 10.8, fgm: 8.7, fga: 19.7, fgPct: 44.2, fg3m: 3.5, fg3a: 9.5, fg3Pct: 36.8, ftm: 5.5, fta: 6.3, ftPct: 87.3, mpg: 35.6 },
  { id: 6583, name: 'Anthony Davis', teamTricode: 'LAL', position: 'F-C', jerseyNumber: '3', height: '6-10', weight: '253', ppg: 24.7, rpg: 12.6, apg: 3.5, fgm: 9.4, fga: 16.5, fgPct: 57.0, fg3m: 0.6, fg3a: 1.9, fg3Pct: 31.6, ftm: 5.3, fta: 6.9, ftPct: 76.8, mpg: 34.1 },
  { id: 4433134, name: 'Tyrese Haliburton', teamTricode: 'IND', position: 'G', jerseyNumber: '0', height: '6-5', weight: '185', ppg: 20.1, rpg: 3.9, apg: 10.9, fgm: 7.3, fga: 15.1, fgPct: 48.3, fg3m: 2.9, fg3a: 7.8, fg3Pct: 37.2, ftm: 2.6, fta: 3.2, ftPct: 81.3, mpg: 32.6 },
  { id: 3136193, name: 'Devin Booker', teamTricode: 'PHX', position: 'G', jerseyNumber: '1', height: '6-5', weight: '206', ppg: 27.1, rpg: 4.5, apg: 6.7, fgm: 9.8, fga: 20.4, fgPct: 48.0, fg3m: 2.7, fg3a: 6.9, fg3Pct: 39.1, ftm: 4.8, fta: 5.6, ftPct: 85.7, mpg: 36.0 },
  { id: 4395628, name: 'Zion Williamson', teamTricode: 'NOP', position: 'F', jerseyNumber: '1', height: '6-6', weight: '284', ppg: 22.9, rpg: 5.8, apg: 5.0, fgm: 8.6, fga: 13.9, fgPct: 61.9, fg3m: 0.2, fg3a: 0.9, fg3Pct: 22.2, ftm: 5.5, fta: 8.5, ftPct: 64.7, mpg: 31.1 },
  { id: 4432816, name: 'LaMelo Ball', teamTricode: 'CHA', position: 'G', jerseyNumber: '1', height: '6-7', weight: '180', ppg: 23.9, rpg: 5.1, apg: 8.0, fgm: 8.4, fga: 19.5, fgPct: 43.1, fg3m: 3.4, fg3a: 9.7, fg3Pct: 35.1, ftm: 3.7, fta: 4.8, ftPct: 77.1, mpg: 34.6 },
  { id: 4066636, name: 'Donovan Mitchell', teamTricode: 'CLE', position: 'G', jerseyNumber: '45', height: '6-1', weight: '215', ppg: 27.6, rpg: 5.3, apg: 6.1, fgm: 9.7, fga: 21.0, fgPct: 46.2, fg3m: 3.6, fg3a: 9.3, fg3Pct: 38.7, ftm: 4.6, fta: 5.5, ftPct: 83.6, mpg: 35.8 },
  { id: 2991043, name: 'Kawhi Leonard', teamTricode: 'LAC', position: 'F', jerseyNumber: '2', height: '6-7', weight: '225', ppg: 23.6, rpg: 6.2, apg: 3.5, fgm: 8.8, fga: 17.3, fgPct: 50.9, fg3m: 2.1, fg3a: 5.1, fg3Pct: 41.2, ftm: 3.9, fta: 4.6, ftPct: 84.8, mpg: 34.1 },
  { id: 6450, name: 'Paul George', teamTricode: 'PHI', position: 'F', jerseyNumber: '8', height: '6-8', weight: '220', ppg: 23.5, rpg: 6.1, apg: 4.8, fgm: 8.3, fga: 18.4, fgPct: 45.1, fg3m: 3.2, fg3a: 8.7, fg3Pct: 36.8, ftm: 3.7, fta: 4.3, ftPct: 86.0, mpg: 35.2 },
  { id: 4065679, name: "De'Aaron Fox", teamTricode: 'SAC', position: 'G', jerseyNumber: '5', height: '6-3', weight: '185', ppg: 25.3, rpg: 4.3, apg: 6.0, fgm: 9.5, fga: 19.8, fgPct: 48.0, fg3m: 2.3, fg3a: 6.1, fg3Pct: 37.7, ftm: 4.0, fta: 5.1, ftPct: 78.4, mpg: 35.6 },
  { id: 1628389, name: 'Bam Adebayo', teamTricode: 'MIA', position: 'C', jerseyNumber: '13', height: '6-9', weight: '255', ppg: 19.2, rpg: 10.4, apg: 4.9, fgm: 7.6, fga: 13.9, fgPct: 54.7, fg3m: 0.2, fg3a: 0.8, fg3Pct: 25.0, ftm: 3.8, fta: 5.1, ftPct: 74.5, mpg: 34.3 },
  { id: 4397020, name: 'Jaren Jackson Jr.', teamTricode: 'MEM', position: 'F-C', jerseyNumber: '13', height: '6-11', weight: '242', ppg: 22.5, rpg: 5.5, apg: 1.6, fgm: 7.9, fga: 16.9, fgPct: 46.7, fg3m: 2.4, fg3a: 6.8, fg3Pct: 35.3, ftm: 4.3, fta: 5.2, ftPct: 82.7, mpg: 31.8 },
  { id: 4277847, name: 'Darius Garland', teamTricode: 'CLE', position: 'G', jerseyNumber: '10', height: '6-1', weight: '192', ppg: 21.0, rpg: 2.7, apg: 6.5, fgm: 7.4, fga: 16.3, fgPct: 45.4, fg3m: 2.8, fg3a: 7.5, fg3Pct: 37.3, ftm: 3.4, fta: 3.9, ftPct: 87.2, mpg: 31.2 },
  { id: 4066421, name: 'Brandon Ingram', teamTricode: 'NOP', position: 'F', jerseyNumber: '14', height: '6-8', weight: '190', ppg: 24.0, rpg: 5.7, apg: 5.2, fgm: 8.7, fga: 18.9, fgPct: 46.0, fg3m: 2.0, fg3a: 5.8, fg3Pct: 34.5, ftm: 4.6, fta: 5.6, ftPct: 82.1, mpg: 34.1 },
];

export function searchPlayers(query: string): PlayerInfo[] {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  return POPULAR_PLAYERS.filter(player =>
    player.name.toLowerCase().includes(lowerQuery)
  );
}

export function getPlayerById(id: number): PlayerInfo | undefined {
  return POPULAR_PLAYERS.find(player => player.id === id);
}

export function getPlayersByTeam(teamTricode: string): PlayerInfo[] {
  return POPULAR_PLAYERS.filter(player => player.teamTricode === teamTricode);
}
