export default function Loading() {
  return (
    <div className="min-h-screen bg-space flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
        <p className="text-white/60 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}