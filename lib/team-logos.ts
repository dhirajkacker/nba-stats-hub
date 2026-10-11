import type { LeagueId } from './leagues';

// Team logo utility - uses ESPN's CDN for team logos

export function getTeamLogoUrl(teamTricode: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  // ESPN's team logo CDN
  const sizeMap = {
    small: 65,
    medium: 500,
    large: 1000,
  };

  // Normalize team tricode (handle variations)
  const normalizeTricode = (code: string): string => {
    const normalized: { [key: string]: string } = {
      'GS': 'GSW',
      'SA': 'SAS',
      'NY': 'NYK',
      'NO': 'NOP',
      'UTAH': 'UTA',  // ESPN uses "UTAH" instead of "UTA"
      'WSH': 'WAS',
    };
    return normalized[code.toUpperCase()] || code.toUpperCase();
  };

  const normalizedTricode = normalizeTricode(teamTricode);

  // ESPN logo CDN uses different abbreviations than NBA API
  // Map NBA tricodes to ESPN logo filenames
  const espnLogoMap: { [key: string]: string } = {
    'ATL': 'atl',
    'BOS': 'bos',
    'BKN': 'bkn',
    'CHA': 'cha',
    'CHI': 'chi',
    'CLE': 'cle',
    'DAL': 'dal',
    'DEN': 'den',
    'DET': 'det',
    'GSW': 'gs',
    'GS': 'gs',       // Handle both GS and GSW
    'HOU': 'hou',
    'IND': 'ind',
    'LAC': 'lac',
    'LAL': 'lal',
    'MEM': 'mem',
    'MIA': 'mia',
    'MIL': 'mil',
    'MIN': 'min',
    'NOP': 'no',      // ESPN uses 'no' not 'nop'
    'NO': 'no',       // Handle both NO and NOP
    'NYK': 'ny',
    'NY': 'ny',       // Handle both NY and NYK
    'OKC': 'okc',
    'ORL': 'orl',
    'PHI': 'phi',
    'PHX': 'phx',
    'POR': 'por',
    'SAC': 'sac',
    'SAS': 'sa',
    'SA': 'sa',       // Handle both SA and SAS
    'TOR': 'tor',
    'UTA': 'utah',    // ESPN uses full name 'utah' not 'uta'
    'UTAH': 'utah',   // Handle ESPN's "UTAH" abbreviation
    'WAS': 'wsh',
    'WSH': 'wsh',     // Handle ESPN's "WSH" abbreviation
  };

  const espnLogoName = espnLogoMap[normalizedTricode];

  if (!espnLogoName) {
    // Fallback to a generic basketball icon
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/nba.png&h=${sizeMap[size]}&w=${sizeMap[size]}`;
  }

  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${espnLogoName}.png&h=${sizeMap[size]}&w=${sizeMap[size]}`;
}

// Get team primary color for UI theming
export function getTeamColor(teamTricode: string): string {
  // Normalize team tricode (handle variations)
  const normalizeTricode = (code: string): string => {
    const normalized: { [key: string]: string } = {
      'GS': 'GSW',
      'NO': 'NOP',
      'SA': 'SAS',
      'NY': 'NYK',
      'UTAH': 'UTA',  // ESPN uses "UTAH" instead of "UTA"
      'WSH': 'WAS',
    };
    return normalized[code.toUpperCase()] || code.toUpperCase();
  };

  const normalizedTricode = normalizeTricode(teamTricode);

  const teamColors: { [key: string]: string } = {
    'ATL': '#E03A3E',
    'BOS': '#007A33',
    'BKN': '#000000',
    'CHA': '#1D1160',
    'CHI': '#CE1141',
    'CLE': '#860038',
    'DAL': '#00538C',
    'DEN': '#0E2240',
    'DET': '#C8102E',
    'GSW': '#1D428A',
    'HOU': '#CE1141',
    'IND': '#002D62',
    'LAC': '#C8102E',
    'LAL': '#552583',
    'MEM': '#5D76A9',
    'MIA': '#98002E',
    'MIL': '#00471B',
    'MIN': '#0C2340',
    'NOP': '#0C2340',
    'NYK': '#006BB6',
    'OKC': '#007AC1',
    'ORL': '#0077C0',
    'PHI': '#006BB6',
    'PHX': '#1D1160',
    'POR': '#E03A3E',
    'SAC': '#5A2D81',
    'SAS': '#C4CED4',
    'TOR': '#CE1141',
    'UTA': '#002B5C',
    'WAS': '#002B5C',
  };

  return teamColors[normalizedTricode] || '#1D428A'; // Default to NBA blue
}

// ---------------------------------------------------------------------------
// League-aware wrappers. Every page that can show WNBA teams must use these,
// never getTeamLogoUrl/getTeamColor directly: those map tricodes to NBA teams,
// so a WNBA "NY" would render the Knicks logo.
// ---------------------------------------------------------------------------


export interface TeamRef {
  abbrev?: string;
  id?: string | number;
  /** ESPN-provided logo URL. Required for WNBA logos. */
  logo?: string | null;
}

/**
 * Logo URL for a team, or null when none is known (render an initials badge).
 * NBA: the existing tricode-based ESPN logo. WNBA: only the logo URL ESPN gave
 * us for that team and season. WNBA logos are never derived from a tricode,
 * because tricodes change across eras and collide with NBA ones.
 */
export function teamLogoSrc(
  league: LeagueId,
  team: TeamRef,
  size: 'small' | 'medium' | 'large' = 'medium',
): string | null {
  if (league === 'nba') return getTeamLogoUrl(team.abbrev ?? '', size);
  return team.logo || null;
}

// WNBA colors keyed by ESPN franchise id (ids persist through relocations, so
// id 17 is San Antonio in 2010 and Las Vegas today). Values are ESPN's primary
// colors, except where the primary is too light for white header text; those
// use a darker shade from the team's palette.
const WNBA_TEAM_COLORS: Record<string, string> = {
  '20': '#E31837',     // Atlanta Dream
  '19': '#5091CD',     // Chicago Sky
  '18': '#F05023',     // Connecticut Sun
  '3': '#002B5C',      // Dallas Wings (Detroit/Tulsa Shock)
  '129689': '#5B3B8C', // Golden State Valkyries (primary #B38FCF is too light)
  '5': '#002D62',      // Indiana Fever
  '17': '#4A4B4D',     // Las Vegas Aces / San Antonio (primary #A7A8AA is too light)
  '6': '#552583',      // Los Angeles Sparks
  '8': '#266092',      // Minnesota Lynx
  '9': '#2D7A6E',      // New York Liberty (primary #86CEBC is too light)
  '11': '#3C286E',     // Phoenix Mercury
  '132052': '#3F6F80', // Portland Fire (primary #CEE5EB is too light)
  '14': '#2C5235',     // Seattle Storm
  '131935': '#33476D', // Toronto Tempo
  '16': '#E03A3E',     // Washington Mystics
};

export const WNBA_DEFAULT_COLOR = '#C2410C';

export function teamColor(league: LeagueId, team: TeamRef): string {
  if (league === 'nba') return getTeamColor(team.abbrev ?? '');
  return WNBA_TEAM_COLORS[String(team.id ?? '')] ?? WNBA_DEFAULT_COLOR;
}

/** Up to three letters for a logo placeholder badge. */
export function teamInitials(team: TeamRef & { name?: string }): string {
  return (team.abbrev || team.name || '?').slice(0, 3).toUpperCase();
}
