import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-space flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-white/60 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl text-white font-semibold hover:opacity-90 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}