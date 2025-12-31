export default function TeamsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header Skeleton */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-6 w-32 bg-white bg-opacity-20 rounded-lg animate-pulse mb-4"></div>
          <div className="h-10 w-48 bg-white bg-opacity-20 rounded-lg animate-pulse mb-2"></div>
          <div className="h-6 w-64 bg-white bg-opacity-10 rounded-lg animate-pulse"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Teams Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="flex gap-4">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
