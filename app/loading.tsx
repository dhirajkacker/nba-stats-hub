export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      {/* Header Skeleton */}
      <header className="bg-gradient-to-r from-gray-900 via-orange-600 to-gray-900 text-white shadow-2xl border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 w-64 bg-white bg-opacity-20 rounded-lg animate-pulse mb-2"></div>
          <div className="h-6 w-48 bg-white bg-opacity-10 rounded-lg animate-pulse"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="h-8 w-48 bg-gray-300 rounded-lg animate-pulse mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
                >
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="h-8 w-32 bg-gray-300 rounded-lg animate-pulse mb-6"></div>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
                >
                  <div className="bg-gray-200 h-12 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="flex gap-3">
                        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
