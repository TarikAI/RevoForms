'use client'

import { motion, useSpring, useMotionValue } from 'framer-motion'
import type { AvatarState } from '@/types/chat'
import type { VisemeName } from '@/lib/visemes'
import { interpolateVisemes } from '@/lib/visemes'

interface AvatarFaceProps {
  state: AvatarState
  size?: number
  viseme?: VisemeName
  forceMouthState?: {
    open: number
    width: number
    spread: number
  }
}

export function AvatarFace({ state, size = 120, viseme, forceMouthState }: AvatarFaceProps) {
  // Animated mouth values
  const mouthOpen = useMotionValue(0)
  const mouthWidth = useMotionValue(0.5)
  const mouthSpread = useMotionValue(0.3)

  // Animate mouth based on viseme or forced state
  if (forceMouthState) {
    mouthOpen.set(forceMouthState.open)
    mouthWidth.set(forceMouthState.width)
    mouthSpread.set(forceMouthState.spread)
  } else if (viseme) {
    const mouthShape = getVisemeMouthShape(viseme)
    mouthOpen.set(mouthShape.open)
    mouthWidth.set(mouthShape.width)
    mouthSpread.set(mouthShape.spread)
  } else {
    // Reset to neutral when not speaking
    mouthOpen.set(0)
    mouthWidth.set(0.5)
    mouthSpread.set(0.3)
  }

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

  // Get mouth shape for viseme
  function getVisemeMouthShape(v: VisemeName) {
    const shapes: Record<VisemeName, { open: number; width: number; spread: number }> = {
      X: { open: 0, width: 0.5, spread: 0.3 },
      B: { open: 0.05, width: 0.6, spread: 0.4 },
      C: { open: 0.15, width: 0.5, spread: 0.5 },
      D: { open: 0.1, width: 0.4, spread: 0.2 },
      E: { open: 0.4, width: 0.4, spread: 0.3 },
      F: { open: 0.15, width: 0.5, spread: 0.6 },
      G: { open: 0.2, width: 0.5, spread: 0.3 },
      H: { open: 0.3, width: 0.4, spread: 0.2 },
      L: { open: 0.12, width: 0.35, spread: 0.25 },
      M: { open: 0.02, width: 0.55, spread: 0.35 },
      N: { open: 0.1, width: 0.4, spread: 0.2 },
      O: { open: 0.25, width: 0.35, spread: 0.3 },
      P: { open: 0.05, width: 0.6, spread: 0.4 },
      Q: { open: 0.2, width: 0.35, spread: 0.3 },
      R: { open: 0.15, width: 0.4, spread: 0.35 },
      S: { open: 0.08, width: 0.45, spread: 0.5 },
      T: { open: 0.1, width: 0.4, spread: 0.2 },
      U: { open: 0.1, width: 0.3, spread: 0.4 },
      V: { open: 0.15, width: 0.5, spread: 0.6 },
      W: { open: 0.12, width: 0.3, spread: 0.35 },
      Y: { open: 0.15, width: 0.45, spread: 0.45 },
    }
    return shapes[v] || shapes.X
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
        className="relative rounded-full bg-gradient-to-br from-space-light to-space flex flex-col items-center justify-center overflow-hidden"
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

        {/* Animated Mouth */}
        <motion.div
          className="mt-1 relative"
          animate={{
            height: size * 0.15 * mouthOpen.get() + (size * 0.02),
            width: size * 0.25 * mouthWidth.get(),
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          style={{
            borderRadius: `${size * 0.15 * mouthSpread.get()}px`,
          }}
        >
          <div className="w-full h-full bg-gradient-to-b from-neon-purple/80 to-neon-cyan/60 rounded-full" />
        </motion.div>
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
