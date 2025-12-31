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
