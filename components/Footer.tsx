import Link from 'next/link';

export default function Footer() {
  return (
    <>
      {/* Quick Links Section */}
      <div className="bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <h3 className="text-2xl font-black text-gray-900">
                Explore More Stats
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/teams"
                className="group block p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="text-3xl mb-3">🏀</div>
                <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  Team Stats
                </h4>
                <p className="text-sm text-gray-600">
                  View detailed team statistics and game logs
                </p>
              </Link>
              <Link
                href="/players"
                className="group block p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="text-3xl mb-3">⛹️</div>
                <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  Player Stats
                </h4>
                <p className="text-sm text-gray-600">
                  Search players and view their performance
                </p>
              </Link>
              <Link
                href="/standings"
                className="group block p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="text-3xl mb-3">🏆</div>
                <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  Full Standings
                </h4>
                <p className="text-sm text-gray-600">
                  View current and last season standings
                </p>
              </Link>
              <Link
                href="/history"
                className="group block p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="text-3xl mb-3">👑</div>
                <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  Champions History
                </h4>
                <p className="text-sm text-gray-600">
                  NBA Finals and Conference champions through the years
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border-t-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-300 font-semibold mb-2">
              🏀 NBA Stats Hub - Real-time scores and statistics
            </p>
            <p className="text-gray-500 text-sm">
              Data provided by NBA.com and ESPN
            </p>
            <p className="text-gray-600 text-xs mt-3">
              Live scores update every 30 seconds during games
            </p>
            <p className="text-gray-500 text-xs mt-4 border-t border-gray-700 pt-4">
              Made by Claude Code / Prompted by Dhiraj Kacker
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Version 1.1
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
