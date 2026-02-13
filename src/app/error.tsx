'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-space flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-white/60 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl text-white font-semibold hover:opacity-90 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  )
}