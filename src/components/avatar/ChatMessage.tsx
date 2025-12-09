'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

// Format time consistently to avoid hydration mismatch
function formatTime(date: Date | string): string {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [mounted, setMounted] = useState(false)

  // Only show time after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 ${
          isUser
            ? 'message-user ml-auto'
            : 'message-ai mr-auto'
        }`}
      >
        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <span className="text-[10px] text-white/40 mt-1 block">
          {mounted ? formatTime(message.timestamp) : '--:--'}
        </span>
      </div>
    </motion.div>
  )
}
