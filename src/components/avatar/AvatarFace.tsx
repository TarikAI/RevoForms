'use client'

import { motion } from 'framer-motion'
import type { AvatarState } from '@/types/chat'

interface AvatarFaceProps {
  state: AvatarState
  size?: number
}

export function AvatarFace({ state, size = 120 }: AvatarFaceProps) {
  // Colors based on state
  const getGlowColor = () => {
    switch (state) {
      case 'listening':
        return 'rgba(239, 68, 68, 0.6)' // Red for listening
      case 'thinking':
        return 'rgba(138, 43, 226, 0.6)'
      case 'speaking':
        return 'rgba(0, 255, 255, 0.8)'
      case 'error':
        return 'rgba(255, 100, 100, 0.6)'
      default:
        return 'rgba(0, 255, 255, 0.3)'
    }
  }

  const getEyeAnimation = () => {
    if (state === 'speaking') return { 
      scale: [1, 1.15, 1], 
      transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" } 
    }
    if (state === 'thinking') return { 
      y: [0, -3, 0], 
      transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } 
    }
    if (state === 'listening') return {
      scale: [1, 1.1, 1],
      transition: { repeat: Infinity, duration: 0.6, ease: "easeInOut" }
    }
    return {}
  }

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={state === 'error' ? { x: [0, -3, 3, -3, 0] } : {}}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: `0 0 ${state === 'idle' ? '20px' : '40px'} ${getGlowColor()}`,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: getGlowColor() }}
        animate={state === 'thinking' ? { rotate: 360 } : { rotate: 0 }}
        transition={state === 'thinking' ? { repeat: Infinity, duration: 2.5, ease: 'linear' } : { duration: 0.3 }}
      />

      {/* Face Container */}
      <div 
        className="relative rounded-full bg-gradient-to-br from-space-light to-space flex items-center justify-center"
        style={{ width: size * 0.85, height: size * 0.85 }}
      >
        {/* Eyes */}
        <div className="flex gap-3" style={{ marginTop: -size * 0.05 }}>
          <motion.div
            className="rounded-full bg-neon-cyan"
            style={{ width: size * 0.12, height: size * 0.15 }}
            animate={getEyeAnimation()}
          />
          <motion.div
            className="rounded-full bg-neon-cyan"
            style={{ width: size * 0.12, height: size * 0.15 }}
            animate={getEyeAnimation()}
          />
        </div>
      </div>

      {/* Listening Indicator - Sound Waves */}
      {state === 'listening' && (
        <div className="absolute -bottom-4 flex items-end justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-red-400 rounded-full"
              animate={{ height: [4, 16, 4] }}
              transition={{
                repeat: Infinity,
                duration: 0.4,
                delay: i * 0.08,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking Indicator - Rotating Dots */}
      {state === 'thinking' && (
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-neon-purple"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: Math.cos((i * Math.PI) / 2) * (size * 0.55) - 4,
                y: Math.sin((i * Math.PI) / 2) * (size * 0.55) - 4,
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
