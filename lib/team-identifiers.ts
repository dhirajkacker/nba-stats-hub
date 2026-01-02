// Centralized team identifier mapping
// Resolves various team identifiers (city names, team names, alternate codes) to standard tricodes

export interface TeamInfo {
  tricode: string;
  city: string;
  name: string;
  fullName: string;
  conference: 'East' | 'West';
}

// All 30 NBA teams with their standard tricodes and names
export const NBA_TEAMS: TeamInfo[] = [
  { tricode: 'ATL', city: 'Atlanta', name: 'Hawks', fullName: 'Atlanta Hawks', conference: 'East' },
  { tricode: 'BOS', city: 'Boston', name: 'Celtics', fullName: 'Boston Celtics', conference: 'East' },
  { tricode: 'BKN', city: 'Brooklyn', name: 'Nets', fullName: 'Brooklyn Nets', conference: 'East' },
  { tricode: 'CHA', city: 'Charlotte', name: 'Hornets', fullName: 'Charlotte Hornets', conference: 'East' },
  { tricode: 'CHI', city: 'Chicago', name: 'Bulls', fullName: 'Chicago Bulls', conference: 'East' },
  { tricode: 'CLE', city: 'Cleveland', name: 'Cavaliers', fullName: 'Cleveland Cavaliers', conference: 'East' },
  { tricode: 'DAL', city: 'Dallas', name: 'Mavericks', fullName: 'Dallas Mavericks', conference: 'West' },
  { tricode: 'DEN', city: 'Denver', name: 'Nuggets', fullName: 'Denver Nuggets', conference: 'West' },
  { tricode: 'DET', city: 'Detroit', name: 'Pistons', fullName: 'Detroit Pistons', conference: 'East' },
  { tricode: 'GSW', city: 'Golden State', name: 'Warriors', fullName: 'Golden State Warriors', conference: 'West' },
  { tricode: 'HOU', city: 'Houston', name: 'Rockets', fullName: 'Houston Rockets', conference: 'West' },
  { tricode: 'IND', city: 'Indiana', name: 'Pacers', fullName: 'Indiana Pacers', conference: 'East' },
  { tricode: 'LAC', city: 'Los Angeles', name: 'Clippers', fullName: 'Los Angeles Clippers', conference: 'West' },
  { tricode: 'LAL', city: 'Los Angeles', name: 'Lakers', fullName: 'Los Angeles Lakers', conference: 'West' },
  { tricode: 'MEM', city: 'Memphis', name: 'Grizzlies', fullName: 'Memphis Grizzlies', conference: 'West' },
  { tricode: 'MIA', city: 'Miami', name: 'Heat', fullName: 'Miami Heat', conference: 'East' },
  { tricode: 'MIL', city: 'Milwaukee', name: 'Bucks', fullName: 'Milwaukee Bucks', conference: 'East' },
  { tricode: 'MIN', city: 'Minnesota', name: 'Timberwolves', fullName: 'Minnesota Timberwolves', conference: 'West' },
  { tricode: 'NOP', city: 'New Orleans', name: 'Pelicans', fullName: 'New Orleans Pelicans', conference: 'West' },
  { tricode: 'NYK', city: 'New York', name: 'Knicks', fullName: 'New York Knicks', conference: 'East' },
  { tricode: 'OKC', city: 'Oklahoma City', name: 'Thunder', fullName: 'Oklahoma City Thunder', conference: 'West' },
  { tricode: 'ORL', city: 'Orlando', name: 'Magic', fullName: 'Orlando Magic', conference: 'East' },
  { tricode: 'PHI', city: 'Philadelphia', name: '76ers', fullName: 'Philadelphia 76ers', conference: 'East' },
  { tricode: 'PHX', city: 'Phoenix', name: 'Suns', fullName: 'Phoenix Suns', conference: 'West' },
  { tricode: 'POR', city: 'Portland', name: 'Trail Blazers', fullName: 'Portland Trail Blazers', conference: 'West' },
  { tricode: 'SAC', city: 'Sacramento', name: 'Kings', fullName: 'Sacramento Kings', conference: 'West' },
  { tricode: 'SAS', city: 'San Antonio', name: 'Spurs', fullName: 'San Antonio Spurs', conference: 'West' },
  { tricode: 'TOR', city: 'Toronto', name: 'Raptors', fullName: 'Toronto Raptors', conference: 'East' },
  { tricode: 'UTA', city: 'Utah', name: 'Jazz', fullName: 'Utah Jazz', conference: 'West' },
  { tricode: 'WAS', city: 'Washington', name: 'Wizards', fullName: 'Washington Wizards', conference: 'East' },
];

// Map of alternate identifiers to standard tricodes
// Includes: city names (lowercase), team names (lowercase), alternate abbreviations
const IDENTIFIER_MAP: { [key: string]: string } = {
  // Atlanta Hawks
  'atl': 'ATL', 'atlanta': 'ATL', 'hawks': 'ATL',

  // Boston Celtics
  'bos': 'BOS', 'boston': 'BOS', 'celtics': 'BOS',

  // Brooklyn Nets
  'bkn': 'BKN', 'brooklyn': 'BKN', 'nets': 'BKN', 'nj': 'BKN', 'newjersey': 'BKN',

  // Charlotte Hornets
  'cha': 'CHA', 'charlotte': 'CHA', 'hornets': 'CHA',

  // Chicago Bulls
  'chi': 'CHI', 'chicago': 'CHI', 'bulls': 'CHI',

  // Cleveland Cavaliers
  'cle': 'CLE', 'cleveland': 'CLE', 'cavaliers': 'CLE', 'cavs': 'CLE',

  // Dallas Mavericks
  'dal': 'DAL', 'dallas': 'DAL', 'mavericks': 'DAL', 'mavs': 'DAL',

  // Denver Nuggets
  'den': 'DEN', 'denver': 'DEN', 'nuggets': 'DEN',

  // Detroit Pistons
  'det': 'DET', 'detroit': 'DET', 'pistons': 'DET',

  // Golden State Warriors
  'gsw': 'GSW', 'gs': 'GSW', 'goldenstate': 'GSW', 'warriors': 'GSW', 'golden-state': 'GSW',

  // Houston Rockets
  'hou': 'HOU', 'houston': 'HOU', 'rockets': 'HOU',

  // Indiana Pacers
  'ind': 'IND', 'indiana': 'IND', 'pacers': 'IND',

  // Los Angeles Clippers
  'lac': 'LAC', 'laclippers': 'LAC', 'clippers': 'LAC', 'la-clippers': 'LAC',

  // Los Angeles Lakers
  'lal': 'LAL', 'lalakers': 'LAL', 'lakers': 'LAL', 'la-lakers': 'LAL', 'losangeles': 'LAL',

  // Memphis Grizzlies
  'mem': 'MEM', 'memphis': 'MEM', 'grizzlies': 'MEM', 'grizz': 'MEM',

  // Miami Heat
  'mia': 'MIA', 'miami': 'MIA', 'heat': 'MIA',

  // Milwaukee Bucks
  'mil': 'MIL', 'milwaukee': 'MIL', 'bucks': 'MIL',

  // Minnesota Timberwolves
  'min': 'MIN', 'minnesota': 'MIN', 'timberwolves': 'MIN', 'wolves': 'MIN', 'twolves': 'MIN',

  // New Orleans Pelicans
  'nop': 'NOP', 'no': 'NOP', 'neworleans': 'NOP', 'pelicans': 'NOP', 'pels': 'NOP', 'new-orleans': 'NOP',

  // New York Knicks
  'nyk': 'NYK', 'ny': 'NYK', 'newyork': 'NYK', 'knicks': 'NYK', 'new-york': 'NYK',

  // Oklahoma City Thunder
  'okc': 'OKC', 'oklahomacity': 'OKC', 'thunder': 'OKC', 'oklahoma': 'OKC', 'oklahoma-city': 'OKC',

  // Orlando Magic
  'orl': 'ORL', 'orlando': 'ORL', 'magic': 'ORL',

  // Philadelphia 76ers
  'phi': 'PHI', 'philadelphia': 'PHI', '76ers': 'PHI', 'sixers': 'PHI', 'philly': 'PHI',

  // Phoenix Suns
  'phx': 'PHX', 'phoenix': 'PHX', 'suns': 'PHX',

  // Portland Trail Blazers
  'por': 'POR', 'portland': 'POR', 'trailblazers': 'POR', 'blazers': 'POR', 'trail-blazers': 'POR',

  // Sacramento Kings
  'sac': 'SAC', 'sacramento': 'SAC', 'kings': 'SAC',

  // San Antonio Spurs
  'sas': 'SAS', 'sa': 'SAS', 'sanantonio': 'SAS', 'spurs': 'SAS', 'san-antonio': 'SAS',

  // Toronto Raptors
  'tor': 'TOR', 'toronto': 'TOR', 'raptors': 'TOR',

  // Utah Jazz (ESPN uses "UTAH" as abbreviation)
  'uta': 'UTA', 'utah': 'UTA', 'jazz': 'UTA',

  // Handle ESPN's 4-letter codes that differ from standard 3-letter
  'UTAH': 'UTA',

  // Washington Wizards
  'was': 'WAS', 'wsh': 'WAS', 'washington': 'WAS', 'wizards': 'WAS',
};

/**
 * Normalizes a team tricode to standard 3-letter format
 * Handles ESPN's 4-letter codes like "UTAH" -> "UTA"
 */
export function normalizeTricode(tricode: string): string {
  const upperCode = tricode.toUpperCase();
  // Handle ESPN's non-standard abbreviations
  const normalizations: { [key: string]: string } = {
    'UTAH': 'UTA',
    'GS': 'GSW',
    'NO': 'NOP',
    'SA': 'SAS',
    'NY': 'NYK',
    'WSH': 'WAS',
  };
  return normalizations[upperCode] || upperCode;
}

/**
 * Resolves any team identifier to a standard tricode
 * @param identifier - Can be tricode, city name, team name, or abbreviation (case-insensitive)
 * @returns Standard tricode (e.g., "UTA") or null if not found
 */
export function resolveTeamIdentifier(identifier: string): string | null {
  if (!identifier) return null;

  // Normalize: lowercase, remove spaces and special chars
  const normalized = identifier.toLowerCase().replace(/[\s-_]/g, '');

  // Check direct mapping
  if (IDENTIFIER_MAP[normalized]) {
    return IDENTIFIER_MAP[normalized];
  }

  // Check if it's already a valid tricode (case-insensitive)
  const upperIdentifier = identifier.toUpperCase();
  const team = NBA_TEAMS.find(t => t.tricode === upperIdentifier);
  if (team) {
    return team.tricode;
  }

  return null;
}

/**
 * Gets full team info from any identifier
 * @param identifier - Can be tricode, city name, team name, or abbreviation
 * @returns TeamInfo object or null if not found
 */
export function getTeamInfo(identifier: string): TeamInfo | null {
  const tricode = resolveTeamIdentifier(identifier);
  if (!tricode) return null;

  return NBA_TEAMS.find(t => t.tricode === tricode) || null;
}

/**
 * Validates if an identifier corresponds to a valid NBA team
 * @param identifier - Any team identifier
 * @returns true if valid, false otherwise
 */
export function isValidTeamIdentifier(identifier: string): boolean {
  return resolveTeamIdentifier(identifier) !== null;
}

/**
 * Gets all valid identifiers for a team
 * @param tricode - Standard team tricode
 * @returns Array of all valid identifiers for this team
 */
export function getTeamIdentifiers(tricode: string): string[] {
  const identifiers: string[] = [];
  const upperTricode = tricode.toUpperCase();

  for (const [key, value] of Object.entries(IDENTIFIER_MAP)) {
    if (value === upperTricode) {
      identifiers.push(key);
    }
  }

  return identifiers;
}
