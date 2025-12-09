'use client'

import { useState, useEffect } from 'react'

export function DebugOverlay() {
  const [clicks, setClicks] = useState(0)
  const [lastClick, setLastClick] = useState('')

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setClicks(c => c + 1)
      setLastClick(`${e.clientX}, ${e.clientY}`)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed top-20 right-4 z-50 p-4 bg-black/80 text-white text-xs rounded-lg">
      <div>Clicks: {clicks}</div>
      <div>Last: {lastClick}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  )
}