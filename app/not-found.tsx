import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-black text-gray-200 mb-4">404</div>
        <div className="text-6xl mb-8">🏀</div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Looks like this play didn't work out. The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            Back to Home
          </Link>
          <Link
            href="/teams"
            className="bg-white text-gray-900 font-bold px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-colors"
          >
            View Teams
          </Link>
        </div>
      </div>
    </div>
  );
}
