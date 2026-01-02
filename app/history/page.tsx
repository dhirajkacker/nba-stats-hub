import Link from 'next/link';
import Footer from '@/components/Footer';

// Complete NBA Championship History (1947-2024)
const NBA_CHAMPIONS = [
  { year: 2024, champion: 'Boston Celtics', runnerUp: 'Dallas Mavericks', score: '4-1', fmvp: 'Jaylen Brown', eastChamp: 'Boston Celtics', eastRunnerUp: 'Indiana Pacers', westChamp: 'Dallas Mavericks', westRunnerUp: 'Minnesota Timberwolves' },
  { year: 2023, champion: 'Denver Nuggets', runnerUp: 'Miami Heat', score: '4-1', fmvp: 'Nikola Jokic', eastChamp: 'Miami Heat', eastRunnerUp: 'Boston Celtics', westChamp: 'Denver Nuggets', westRunnerUp: 'Los Angeles Lakers' },
  { year: 2022, champion: 'Golden State Warriors', runnerUp: 'Boston Celtics', score: '4-2', fmvp: 'Stephen Curry', eastChamp: 'Boston Celtics', eastRunnerUp: 'Miami Heat', westChamp: 'Golden State Warriors', westRunnerUp: 'Dallas Mavericks' },
  { year: 2021, champion: 'Milwaukee Bucks', runnerUp: 'Phoenix Suns', score: '4-2', fmvp: 'Giannis Antetokounmpo', eastChamp: 'Milwaukee Bucks', eastRunnerUp: 'Atlanta Hawks', westChamp: 'Phoenix Suns', westRunnerUp: 'Los Angeles Clippers' },
  { year: 2020, champion: 'Los Angeles Lakers', runnerUp: 'Miami Heat', score: '4-2', fmvp: 'LeBron James', eastChamp: 'Miami Heat', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Denver Nuggets' },
  { year: 2019, champion: 'Toronto Raptors', runnerUp: 'Golden State Warriors', score: '4-2', fmvp: 'Kawhi Leonard', eastChamp: 'Toronto Raptors', eastRunnerUp: 'Milwaukee Bucks', westChamp: 'Golden State Warriors', westRunnerUp: 'Portland Trail Blazers' },
  { year: 2018, champion: 'Golden State Warriors', runnerUp: 'Cleveland Cavaliers', score: '4-0', fmvp: 'Kevin Durant', eastChamp: 'Cleveland Cavaliers', eastRunnerUp: 'Boston Celtics', westChamp: 'Golden State Warriors', westRunnerUp: 'Houston Rockets' },
  { year: 2017, champion: 'Golden State Warriors', runnerUp: 'Cleveland Cavaliers', score: '4-1', fmvp: 'Kevin Durant', eastChamp: 'Cleveland Cavaliers', eastRunnerUp: 'Boston Celtics', westChamp: 'Golden State Warriors', westRunnerUp: 'San Antonio Spurs' },
  { year: 2016, champion: 'Cleveland Cavaliers', runnerUp: 'Golden State Warriors', score: '4-3', fmvp: 'LeBron James', eastChamp: 'Cleveland Cavaliers', eastRunnerUp: 'Toronto Raptors', westChamp: 'Golden State Warriors', westRunnerUp: 'Oklahoma City Thunder' },
  { year: 2015, champion: 'Golden State Warriors', runnerUp: 'Cleveland Cavaliers', score: '4-2', fmvp: 'Andre Iguodala', eastChamp: 'Cleveland Cavaliers', eastRunnerUp: 'Atlanta Hawks', westChamp: 'Golden State Warriors', westRunnerUp: 'Houston Rockets' },
  { year: 2014, champion: 'San Antonio Spurs', runnerUp: 'Miami Heat', score: '4-1', fmvp: 'Kawhi Leonard', eastChamp: 'Miami Heat', eastRunnerUp: 'Indiana Pacers', westChamp: 'San Antonio Spurs', westRunnerUp: 'Oklahoma City Thunder' },
  { year: 2013, champion: 'Miami Heat', runnerUp: 'San Antonio Spurs', score: '4-3', fmvp: 'LeBron James', eastChamp: 'Miami Heat', eastRunnerUp: 'Indiana Pacers', westChamp: 'San Antonio Spurs', westRunnerUp: 'Memphis Grizzlies' },
  { year: 2012, champion: 'Miami Heat', runnerUp: 'Oklahoma City Thunder', score: '4-1', fmvp: 'LeBron James', eastChamp: 'Miami Heat', eastRunnerUp: 'Boston Celtics', westChamp: 'Oklahoma City Thunder', westRunnerUp: 'San Antonio Spurs' },
  { year: 2011, champion: 'Dallas Mavericks', runnerUp: 'Miami Heat', score: '4-2', fmvp: 'Dirk Nowitzki', eastChamp: 'Miami Heat', eastRunnerUp: 'Chicago Bulls', westChamp: 'Dallas Mavericks', westRunnerUp: 'Oklahoma City Thunder' },
  { year: 2010, champion: 'Los Angeles Lakers', runnerUp: 'Boston Celtics', score: '4-3', fmvp: 'Kobe Bryant', eastChamp: 'Boston Celtics', eastRunnerUp: 'Orlando Magic', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Phoenix Suns' },
  { year: 2009, champion: 'Los Angeles Lakers', runnerUp: 'Orlando Magic', score: '4-1', fmvp: 'Kobe Bryant', eastChamp: 'Orlando Magic', eastRunnerUp: 'Cleveland Cavaliers', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Denver Nuggets' },
  { year: 2008, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-2', fmvp: 'Paul Pierce', eastChamp: 'Boston Celtics', eastRunnerUp: 'Detroit Pistons', westChamp: 'Los Angeles Lakers', westRunnerUp: 'San Antonio Spurs' },
  { year: 2007, champion: 'San Antonio Spurs', runnerUp: 'Cleveland Cavaliers', score: '4-0', fmvp: 'Tony Parker', eastChamp: 'Cleveland Cavaliers', eastRunnerUp: 'Detroit Pistons', westChamp: 'San Antonio Spurs', westRunnerUp: 'Utah Jazz' },
  { year: 2006, champion: 'Miami Heat', runnerUp: 'Dallas Mavericks', score: '4-2', fmvp: 'Dwyane Wade', eastChamp: 'Miami Heat', eastRunnerUp: 'Detroit Pistons', westChamp: 'Dallas Mavericks', westRunnerUp: 'Phoenix Suns' },
  { year: 2005, champion: 'San Antonio Spurs', runnerUp: 'Detroit Pistons', score: '4-3', fmvp: 'Tim Duncan', eastChamp: 'Detroit Pistons', eastRunnerUp: 'Miami Heat', westChamp: 'San Antonio Spurs', westRunnerUp: 'Phoenix Suns' },
  { year: 2004, champion: 'Detroit Pistons', runnerUp: 'Los Angeles Lakers', score: '4-1', fmvp: 'Chauncey Billups', eastChamp: 'Detroit Pistons', eastRunnerUp: 'Indiana Pacers', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Minnesota Timberwolves' },
  { year: 2003, champion: 'San Antonio Spurs', runnerUp: 'New Jersey Nets', score: '4-2', fmvp: 'Tim Duncan', eastChamp: 'New Jersey Nets', eastRunnerUp: 'Detroit Pistons', westChamp: 'San Antonio Spurs', westRunnerUp: 'Dallas Mavericks' },
  { year: 2002, champion: 'Los Angeles Lakers', runnerUp: 'New Jersey Nets', score: '4-0', fmvp: 'Shaquille O\'Neal', eastChamp: 'New Jersey Nets', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Sacramento Kings' },
  { year: 2001, champion: 'Los Angeles Lakers', runnerUp: 'Philadelphia 76ers', score: '4-1', fmvp: 'Shaquille O\'Neal', eastChamp: 'Philadelphia 76ers', eastRunnerUp: 'Milwaukee Bucks', westChamp: 'Los Angeles Lakers', westRunnerUp: 'San Antonio Spurs' },
  { year: 2000, champion: 'Los Angeles Lakers', runnerUp: 'Indiana Pacers', score: '4-2', fmvp: 'Shaquille O\'Neal', eastChamp: 'Indiana Pacers', eastRunnerUp: 'New York Knicks', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Portland Trail Blazers' },
  { year: 1999, champion: 'San Antonio Spurs', runnerUp: 'New York Knicks', score: '4-1', fmvp: 'Tim Duncan', eastChamp: 'New York Knicks', eastRunnerUp: 'Indiana Pacers', westChamp: 'San Antonio Spurs', westRunnerUp: 'Portland Trail Blazers' },
  { year: 1998, champion: 'Chicago Bulls', runnerUp: 'Utah Jazz', score: '4-2', fmvp: 'Michael Jordan', eastChamp: 'Chicago Bulls', eastRunnerUp: 'Indiana Pacers', westChamp: 'Utah Jazz', westRunnerUp: 'Los Angeles Lakers' },
  { year: 1997, champion: 'Chicago Bulls', runnerUp: 'Utah Jazz', score: '4-2', fmvp: 'Michael Jordan', eastChamp: 'Chicago Bulls', eastRunnerUp: 'Miami Heat', westChamp: 'Utah Jazz', westRunnerUp: 'Houston Rockets' },
  { year: 1996, champion: 'Chicago Bulls', runnerUp: 'Seattle SuperSonics', score: '4-2', fmvp: 'Michael Jordan', eastChamp: 'Chicago Bulls', eastRunnerUp: 'Orlando Magic', westChamp: 'Seattle SuperSonics', westRunnerUp: 'Utah Jazz' },
  { year: 1995, champion: 'Houston Rockets', runnerUp: 'Orlando Magic', score: '4-0', fmvp: 'Hakeem Olajuwon', eastChamp: 'Orlando Magic', eastRunnerUp: 'Indiana Pacers', westChamp: 'Houston Rockets', westRunnerUp: 'San Antonio Spurs' },
  { year: 1994, champion: 'Houston Rockets', runnerUp: 'New York Knicks', score: '4-3', fmvp: 'Hakeem Olajuwon', eastChamp: 'New York Knicks', eastRunnerUp: 'Indiana Pacers', westChamp: 'Houston Rockets', westRunnerUp: 'Utah Jazz' },
  { year: 1993, champion: 'Chicago Bulls', runnerUp: 'Phoenix Suns', score: '4-2', fmvp: 'Michael Jordan', eastChamp: 'Chicago Bulls', eastRunnerUp: 'New York Knicks', westChamp: 'Phoenix Suns', westRunnerUp: 'Seattle SuperSonics' },
  { year: 1992, champion: 'Chicago Bulls', runnerUp: 'Portland Trail Blazers', score: '4-2', fmvp: 'Michael Jordan', eastChamp: 'Chicago Bulls', eastRunnerUp: 'Cleveland Cavaliers', westChamp: 'Portland Trail Blazers', westRunnerUp: 'Utah Jazz' },
  { year: 1991, champion: 'Chicago Bulls', runnerUp: 'Los Angeles Lakers', score: '4-1', fmvp: 'Michael Jordan', eastChamp: 'Chicago Bulls', eastRunnerUp: 'Detroit Pistons', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Portland Trail Blazers' },
  { year: 1990, champion: 'Detroit Pistons', runnerUp: 'Portland Trail Blazers', score: '4-1', fmvp: 'Isiah Thomas', eastChamp: 'Detroit Pistons', eastRunnerUp: 'Chicago Bulls', westChamp: 'Portland Trail Blazers', westRunnerUp: 'Phoenix Suns' },
  { year: 1989, champion: 'Detroit Pistons', runnerUp: 'Los Angeles Lakers', score: '4-0', fmvp: 'Joe Dumars', eastChamp: 'Detroit Pistons', eastRunnerUp: 'Chicago Bulls', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Phoenix Suns' },
  { year: 1988, champion: 'Los Angeles Lakers', runnerUp: 'Detroit Pistons', score: '4-3', fmvp: 'James Worthy', eastChamp: 'Detroit Pistons', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Dallas Mavericks' },
  { year: 1987, champion: 'Los Angeles Lakers', runnerUp: 'Boston Celtics', score: '4-2', fmvp: 'Magic Johnson', eastChamp: 'Boston Celtics', eastRunnerUp: 'Detroit Pistons', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Seattle SuperSonics' },
  { year: 1986, champion: 'Boston Celtics', runnerUp: 'Houston Rockets', score: '4-2', fmvp: 'Larry Bird', eastChamp: 'Boston Celtics', eastRunnerUp: 'Milwaukee Bucks', westChamp: 'Houston Rockets', westRunnerUp: 'Los Angeles Lakers' },
  { year: 1985, champion: 'Los Angeles Lakers', runnerUp: 'Boston Celtics', score: '4-2', fmvp: 'Kareem Abdul-Jabbar', eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia 76ers', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Denver Nuggets' },
  { year: 1984, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-3', fmvp: 'Larry Bird', eastChamp: 'Boston Celtics', eastRunnerUp: 'Milwaukee Bucks', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Phoenix Suns' },
  { year: 1983, champion: 'Philadelphia 76ers', runnerUp: 'Los Angeles Lakers', score: '4-0', fmvp: 'Moses Malone', eastChamp: 'Philadelphia 76ers', eastRunnerUp: 'Milwaukee Bucks', westChamp: 'Los Angeles Lakers', westRunnerUp: 'San Antonio Spurs' },
  { year: 1982, champion: 'Los Angeles Lakers', runnerUp: 'Philadelphia 76ers', score: '4-2', fmvp: 'Magic Johnson', eastChamp: 'Philadelphia 76ers', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'San Antonio Spurs' },
  { year: 1981, champion: 'Boston Celtics', runnerUp: 'Houston Rockets', score: '4-2', fmvp: 'Cedric Maxwell', eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia 76ers', westChamp: 'Houston Rockets', westRunnerUp: 'Kansas City Kings' },
  { year: 1980, champion: 'Los Angeles Lakers', runnerUp: 'Philadelphia 76ers', score: '4-2', fmvp: 'Magic Johnson', eastChamp: 'Philadelphia 76ers', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Seattle SuperSonics' },
  { year: 1979, champion: 'Seattle SuperSonics', runnerUp: 'Washington Bullets', score: '4-1', fmvp: 'Dennis Johnson', eastChamp: 'Washington Bullets', eastRunnerUp: 'San Antonio Spurs', westChamp: 'Seattle SuperSonics', westRunnerUp: 'Phoenix Suns' },
  { year: 1978, champion: 'Washington Bullets', runnerUp: 'Seattle SuperSonics', score: '4-3', fmvp: 'Wes Unseld', eastChamp: 'Washington Bullets', eastRunnerUp: 'Philadelphia 76ers', westChamp: 'Seattle SuperSonics', westRunnerUp: 'Denver Nuggets' },
  { year: 1977, champion: 'Portland Trail Blazers', runnerUp: 'Philadelphia 76ers', score: '4-2', fmvp: 'Bill Walton', eastChamp: 'Philadelphia 76ers', eastRunnerUp: 'Houston Rockets', westChamp: 'Portland Trail Blazers', westRunnerUp: 'Los Angeles Lakers' },
  { year: 1976, champion: 'Boston Celtics', runnerUp: 'Phoenix Suns', score: '4-2', fmvp: 'Jo Jo White', eastChamp: 'Boston Celtics', eastRunnerUp: 'Cleveland Cavaliers', westChamp: 'Phoenix Suns', westRunnerUp: 'Golden State Warriors' },
  { year: 1975, champion: 'Golden State Warriors', runnerUp: 'Washington Bullets', score: '4-0', fmvp: 'Rick Barry', eastChamp: 'Washington Bullets', eastRunnerUp: 'Boston Celtics', westChamp: 'Golden State Warriors', westRunnerUp: 'Chicago Bulls' },
  { year: 1974, champion: 'Boston Celtics', runnerUp: 'Milwaukee Bucks', score: '4-3', fmvp: 'John Havlicek', eastChamp: 'Boston Celtics', eastRunnerUp: 'New York Knicks', westChamp: 'Milwaukee Bucks', westRunnerUp: 'Chicago Bulls' },
  { year: 1973, champion: 'New York Knicks', runnerUp: 'Los Angeles Lakers', score: '4-1', fmvp: 'Willis Reed', eastChamp: 'New York Knicks', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Golden State Warriors' },
  { year: 1972, champion: 'Los Angeles Lakers', runnerUp: 'New York Knicks', score: '4-1', fmvp: 'Wilt Chamberlain', eastChamp: 'New York Knicks', eastRunnerUp: 'Boston Celtics', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Milwaukee Bucks' },
  { year: 1971, champion: 'Milwaukee Bucks', runnerUp: 'Baltimore Bullets', score: '4-0', fmvp: 'Kareem Abdul-Jabbar', eastChamp: 'Baltimore Bullets', eastRunnerUp: 'New York Knicks', westChamp: 'Milwaukee Bucks', westRunnerUp: 'Los Angeles Lakers' },
  { year: 1970, champion: 'New York Knicks', runnerUp: 'Los Angeles Lakers', score: '4-3', fmvp: 'Willis Reed', eastChamp: 'New York Knicks', eastRunnerUp: 'Milwaukee Bucks', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Atlanta Hawks' },
  { year: 1969, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-3', fmvp: 'Jerry West', eastChamp: 'Boston Celtics', eastRunnerUp: 'New York Knicks', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Atlanta Hawks' },
  { year: 1968, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-2', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia 76ers', westChamp: 'Los Angeles Lakers', westRunnerUp: 'San Francisco Warriors' },
  { year: 1967, champion: 'Philadelphia 76ers', runnerUp: 'San Francisco Warriors', score: '4-2', fmvp: null, eastChamp: 'Philadelphia 76ers', eastRunnerUp: 'Boston Celtics', westChamp: 'San Francisco Warriors', westRunnerUp: 'St. Louis Hawks' },
  { year: 1966, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-3', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia 76ers', westChamp: 'Los Angeles Lakers', westRunnerUp: 'St. Louis Hawks' },
  { year: 1965, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-1', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia 76ers', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Baltimore Bullets' },
  { year: 1964, champion: 'Boston Celtics', runnerUp: 'San Francisco Warriors', score: '4-1', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Cincinnati Royals', westChamp: 'San Francisco Warriors', westRunnerUp: 'St. Louis Hawks' },
  { year: 1963, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-2', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Cincinnati Royals', westChamp: 'Los Angeles Lakers', westRunnerUp: 'St. Louis Hawks' },
  { year: 1962, champion: 'Boston Celtics', runnerUp: 'Los Angeles Lakers', score: '4-3', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia Warriors', westChamp: 'Los Angeles Lakers', westRunnerUp: 'Detroit Pistons' },
  { year: 1961, champion: 'Boston Celtics', runnerUp: 'St. Louis Hawks', score: '4-1', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Syracuse Nationals', westChamp: 'St. Louis Hawks', westRunnerUp: 'Los Angeles Lakers' },
  { year: 1960, champion: 'Boston Celtics', runnerUp: 'St. Louis Hawks', score: '4-3', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia Warriors', westChamp: 'St. Louis Hawks', westRunnerUp: 'Minneapolis Lakers' },
  { year: 1959, champion: 'Boston Celtics', runnerUp: 'Minneapolis Lakers', score: '4-0', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Syracuse Nationals', westChamp: 'Minneapolis Lakers', westRunnerUp: 'St. Louis Hawks' },
  { year: 1958, champion: 'St. Louis Hawks', runnerUp: 'Boston Celtics', score: '4-2', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Philadelphia Warriors', westChamp: 'St. Louis Hawks', westRunnerUp: 'Detroit Pistons' },
  { year: 1957, champion: 'Boston Celtics', runnerUp: 'St. Louis Hawks', score: '4-3', fmvp: null, eastChamp: 'Boston Celtics', eastRunnerUp: 'Syracuse Nationals', westChamp: 'St. Louis Hawks', westRunnerUp: 'Minneapolis Lakers' },
  { year: 1956, champion: 'Philadelphia Warriors', runnerUp: 'Fort Wayne Pistons', score: '4-1', fmvp: null, eastChamp: 'Philadelphia Warriors', eastRunnerUp: 'Syracuse Nationals', westChamp: 'Fort Wayne Pistons', westRunnerUp: 'St. Louis Hawks' },
  { year: 1955, champion: 'Syracuse Nationals', runnerUp: 'Fort Wayne Pistons', score: '4-3', fmvp: null, eastChamp: 'Syracuse Nationals', eastRunnerUp: 'Boston Celtics', westChamp: 'Fort Wayne Pistons', westRunnerUp: 'Minneapolis Lakers' },
  { year: 1954, champion: 'Minneapolis Lakers', runnerUp: 'Syracuse Nationals', score: '4-3', fmvp: null, eastChamp: 'Syracuse Nationals', eastRunnerUp: 'Boston Celtics', westChamp: 'Minneapolis Lakers', westRunnerUp: 'Rochester Royals' },
  { year: 1953, champion: 'Minneapolis Lakers', runnerUp: 'New York Knicks', score: '4-1', fmvp: null, eastChamp: 'New York Knicks', eastRunnerUp: 'Boston Celtics', westChamp: 'Minneapolis Lakers', westRunnerUp: 'Fort Wayne Pistons' },
  { year: 1952, champion: 'Minneapolis Lakers', runnerUp: 'New York Knicks', score: '4-3', fmvp: null, eastChamp: 'New York Knicks', eastRunnerUp: 'Syracuse Nationals', westChamp: 'Minneapolis Lakers', westRunnerUp: 'Rochester Royals' },
  { year: 1951, champion: 'Rochester Royals', runnerUp: 'New York Knicks', score: '4-3', fmvp: null, eastChamp: 'New York Knicks', eastRunnerUp: 'Syracuse Nationals', westChamp: 'Rochester Royals', westRunnerUp: 'Minneapolis Lakers' },
  { year: 1950, champion: 'Minneapolis Lakers', runnerUp: 'Syracuse Nationals', score: '4-2', fmvp: null, eastChamp: 'Syracuse Nationals', eastRunnerUp: 'New York Knicks', westChamp: 'Minneapolis Lakers', westRunnerUp: 'Anderson Packers' },
  { year: 1949, champion: 'Minneapolis Lakers', runnerUp: 'Washington Capitols', score: '4-2', fmvp: null, eastChamp: 'Washington Capitols', eastRunnerUp: 'New York Knicks', westChamp: 'Minneapolis Lakers', westRunnerUp: 'Rochester Royals' },
  { year: 1948, champion: 'Baltimore Bullets', runnerUp: 'Philadelphia Warriors', score: '4-2', fmvp: null, eastChamp: 'Philadelphia Warriors', eastRunnerUp: 'New York Knicks', westChamp: 'Baltimore Bullets', westRunnerUp: 'Chicago Stags' },
  { year: 1947, champion: 'Philadelphia Warriors', runnerUp: 'Chicago Stags', score: '4-1', fmvp: null, eastChamp: 'Philadelphia Warriors', eastRunnerUp: 'New York Knicks', westChamp: 'Chicago Stags', westRunnerUp: 'St. Louis Bombers' },
];

// Count championships by team
function getChampionshipCounts() {
  const counts: { [team: string]: number } = {};
  NBA_CHAMPIONS.forEach(c => {
    counts[c.champion] = (counts[c.champion] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([team, count]) => ({ team, count }));
}

export default function HistoryPage() {
  const championshipCounts = getChampionshipCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-orange-200 hover:text-white mb-4 inline-block">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-5xl">👑</div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                NBA Champions History
              </h1>
              <p className="text-orange-200 font-medium mt-1">
                78 seasons of NBA Finals history (1947-2024)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Championship Count Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900">All-Time Championships</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {championshipCounts.slice(0, 12).map((item, index) => (
              <div
                key={item.team}
                className={`text-center p-4 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 ring-2 ring-yellow-400' :
                  index === 1 ? 'bg-gradient-to-br from-gray-100 to-gray-200' :
                  index === 2 ? 'bg-gradient-to-br from-orange-100 to-orange-200' :
                  'bg-gray-50'
                }`}
              >
                <p className="text-3xl font-black text-gray-900">{item.count}</p>
                <p className="text-xs font-semibold text-gray-600 mt-1 truncate" title={item.team}>
                  {item.team}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* NBA Finals History */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black">NBA Finals Results</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Year</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Champion</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Runner-Up</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700 hidden md:table-cell">Finals MVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {NBA_CHAMPIONS.map((row, index) => (
                  <tr key={row.year} className={`hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-3 px-4 font-black text-gray-900">{row.year}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-yellow-500">🏆</span>
                        <span className="font-bold text-gray-900">{row.champion}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{row.runnerUp}</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-800">{row.score}</td>
                    <td className="py-3 px-4 text-gray-700 hidden md:table-cell">
                      {row.fmvp || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conference Champions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Eastern Conference */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-xl">🏀</span>
                </div>
                <h2 className="text-xl font-black">Eastern Conference Finals</h2>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-bold text-gray-700">Year</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-700">Champion</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-500">Runner-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {NBA_CHAMPIONS.map((row, index) => (
                    <tr key={row.year} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-2 px-3 font-semibold text-gray-900">{row.year}</td>
                      <td className="py-2 px-3 font-medium text-blue-800">{row.eastChamp}</td>
                      <td className="py-2 px-3 text-gray-500">{row.eastRunnerUp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Western Conference */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-xl">🏀</span>
                </div>
                <h2 className="text-xl font-black">Western Conference Finals</h2>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-bold text-gray-700">Year</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-700">Champion</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-500">Runner-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {NBA_CHAMPIONS.map((row, index) => (
                    <tr key={row.year} className={`hover:bg-red-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-2 px-3 font-semibold text-gray-900">{row.year}</td>
                      <td className="py-2 px-3 font-medium text-red-800">{row.westChamp}</td>
                      <td className="py-2 px-3 text-gray-500">{row.westRunnerUp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Historical Note */}
        <div className="mt-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">Historical Notes</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• The NBA Finals MVP award was first given in 1969 to Jerry West (who lost in the Finals)</li>
            <li>• The NBA was known as the BAA (Basketball Association of America) from 1946-1949</li>
            <li>• Historic franchise moves: Minneapolis Lakers → Los Angeles (1960), Syracuse Nationals → Philadelphia 76ers (1963), Seattle SuperSonics → Oklahoma City Thunder (2008)</li>
            <li>• The Boston Celtics have won the most championships (18), followed by the Lakers (17 combined Minneapolis/LA)</li>
            <li>• The 2020 Finals were played in the Orlando bubble due to the COVID-19 pandemic</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
