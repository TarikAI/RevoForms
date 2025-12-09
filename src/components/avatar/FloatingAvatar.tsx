'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Send, MessageSquare, Upload, X, 
  Volume2, VolumeX, Loader2
} from 'lucide-react'
import { AvatarFace } from './AvatarFace'
import { useChatStore } from '@/store/chatStore'
import { useFormStore } from '@/store/formStore'
import { useProfileStore } from '@/store/profileStore'
import type { AIResponse } from '@/types/chat'
type VoiceState = 'idle' | 'listening' | 'processing' | 'ready-to-send' | 'speaking'
interface FloatingAvatarProps {
  onOpenSidebar: () => void
  onUploadClick: () => void
}
export function FloatingAvatar({ onOpenSidebar, onUploadClick }: FloatingAvatarProps) {
  // Calculate initial position: center-right of screen
  const getInitialPosition = () => {
    if (typeof window !== 'undefined') {
      // Position in middle-right area
      const x = window.innerWidth - 200 // 200px from right edge
      const y = window.innerHeight / 2 - 60 // Vertically centered

      return { x, y }
    }
    return { x: 800, y: 300 }
  }
  const [position, setPosition] = useState({ x: window.innerWidth - 200, y: 300 })
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const [progress, setProgress] = useState(0)
  const [debugInfo, setDebugInfo] = useState('')
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const transcriptRef = useRef('')
  const { 
    messages, 
    avatarState, 
    isAvatarFloating,
    addMessage, 
    setAvatarState,
    setIsRecording,
    setAvatarFloating,
    setAvatarPosition
  } = useChatStore()
  const { addForm, updateForm, forms, selectedFormId } = useFormStore()
  const { profile } = useProfileStore()
  const currentForm = selectedFormId ? forms.find(f => f.id === selectedFormId) : null
  // Set initial position and update on window resize
  useEffect(() => {
    setPosition(getInitialPosition())

    const handleResize = () => {
      setPosition(getInitialPosition())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  // Keep ref in sync with state
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])
  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.onstart = () => {
          setDebugInfo('Listening...')
        }
        recognition.onresult = (event: any) => {
          let interim = ''
          let final = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              final += result[0].transcript
            } else {
              interim += result[0].transcript
            }
          }
                    setInterimTranscript(interim)
          if (final) {
            setTranscript(prev => {
              const newTranscript = (prev + ' ' + final).trim()
              transcriptRef.current = newTranscript
              return newTranscript
            })
            setShowTranscript(true)
            setDebugInfo(`Heard: "${final}"`)
          }
        }
        recognition.onerror = (event: any) => {
          // "no-speech" is not really an error, just means user didn't say anything
          if (event.error === 'no-speech') {
            setDebugInfo('No speech detected - try again')
            // Don't treat as error, just reset state
            setIsRecording(false)
            setVoiceState('idle')
            setAvatarState('idle')
            return
          }
          // "aborted" happens when we stop recognition manually
          if (event.error === 'aborted') {
            return
          }
          console.error('[FloatingAvatar] Recognition error:', event.error)
          setDebugInfo(`Error: ${event.error}`)
          setIsRecording(false)
          setVoiceState('idle')
          setAvatarState('idle')
        }
        recognition.onend = () => {
          setIsRecording(false)
          if (transcriptRef.current.trim()) {
            setVoiceState('ready-to-send')
            setDebugInfo('Ready to send!')
          } else {
            setVoiceState('idle')
            setDebugInfo('')
          }
        }
        recognitionRef.current = recognition
      } else {
        setDebugInfo('Speech not supported')
      }
    }
    return () => {
      recognitionRef.current?.stop()
    }
  }, [setIsRecording, setAvatarState])
  // Speak text
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !isSpeakingEnabled) return
    synthRef.current.cancel()
    setVoiceState('speaking')
    setAvatarState('speaking')
    const cleanText = text.replace(/\*\*/g, '').replace(/\n/g, '. ').replace(/•/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onend = () => {
      setVoiceState('idle')
      setAvatarState('idle')
    }
    synthRef.current.speak(utterance)
  }, [isSpeakingEnabled, setAvatarState])
  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setDebugInfo('Speech not available')
      return
    }
    setTranscript('')
    setInterimTranscript('')
    transcriptRef.current = ''
    setIsRecording(true)
    setVoiceState('listening')
    setAvatarState('listening')
    setShowTranscript(true)
    setDebugInfo('Starting...')
    try {
      recognitionRef.current.start()
    } catch (e: any) {
      console.error('[FloatingAvatar] Failed to start:', e)
      if (e.message?.includes('already started')) {
        recognitionRef.current.stop()
        setTimeout(() => {
          try {
            recognitionRef.current?.start()
          } catch (e2) {
            console.error('[FloatingAvatar] Retry failed:', e2)
          }
        }, 100)
      } else {
        setIsRecording(false)
        setVoiceState('idle')
        setAvatarState('idle')
        setDebugInfo(`Error: ${e.message}`)
      }
    }
  }, [setIsRecording, setAvatarState])
  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
    if (transcriptRef.current.trim()) {
      setVoiceState('ready-to-send')
      setDebugInfo('Click send or press Enter')
    } else {
      setVoiceState('idle')
      setShowTranscript(false)
      setDebugInfo('')
    }
    setAvatarState('idle')
  }, [setIsRecording, setAvatarState])
  // Send message
  const sendMessage = useCallback(async () => {
    const messageToSend = transcriptRef.current.trim()
    if (!messageToSend) {
      setDebugInfo('No message to send')
      return
    }
    setTranscript('')
    setInterimTranscript('')
    transcriptRef.current = ''
    setVoiceState('processing')
    setAvatarState('thinking')
    setProgress(0)
    setDebugInfo('Processing your request...')
    addMessage({ role: 'user', content: messageToSend })
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)
    try {
      let enhancedMessage = messageToSend
      if (currentForm && (messageToSend.toLowerCase().includes('who filled') || messageToSend.toLowerCase().includes('form content') || messageToSend.toLowerCase().includes('explain') || messageToSend.toLowerCase().includes('tell me about') || messageToSend.toLowerCase().includes('what does'))) {
        const filledData = currentForm.fields.filter(f => f.defaultValue).map(f => `${f.label}: ${f.defaultValue}`).join(', ')
        if (filledData) {
          enhancedMessage = `${messageToSend}\n\nForm data context: The form "${currentForm.name}" has the following filled values: ${filledData}. Based on the profile data, analyze who might have filled this form.`
          if (profile) {
            enhancedMessage += `\n\nUser profile context: ${JSON.stringify(profile)}`
          }
        }
      }
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: enhancedMessage,
          conversationHistory: messages.slice(-10),
          selectedForm: currentForm,
          userProfile: profile
        }),
      })
      clearInterval(progressInterval)
      setProgress(100)
      if (!response.ok) throw new Error('Failed to get response')
      const data: AIResponse = await response.json()
      addMessage({ role: 'assistant', content: data.message })
      speak(data.message)
      setDebugInfo('Done!')
      if (data.action && data.action.type !== 'none') {
        await processAIAction(data)
      }
      setTimeout(() => {
        setProgress(0)
        setShowTranscript(false)
        setVoiceState('idle')
        setDebugInfo('')
      }, 1500)
    } catch (error: any) {
      clearInterval(progressInterval)
      console.error('[FloatingAvatar] AI Error:', error)
      setAvatarState('error')
      setDebugInfo(`Error: ${error.message}`)
      const errorMsg = `Sorry, I encountered an error. Please try again!`
      addMessage({ role: 'assistant', content: errorMsg })
      speak(errorMsg)
      setTimeout(() => {
        setAvatarState('idle')
        setVoiceState('idle')
        setProgress(0)
        setDebugInfo('')
      }, 2000)
    }
  }, [addMessage, currentForm, messages, profile, speak, setAvatarState])
  // Process AI action
  const processAIAction = useCallback(async (response: AIResponse) => {
    if (!response.action || response.action.type === 'none') return
    const { type, payload } = response.action
    const defaultStyling = {
      theme: 'glassmorphism',
      colors: {
        primary: '#06b6d4', secondary: '#a855f7',
        background: 'rgba(15, 15, 26, 0.8)', surface: 'rgba(255, 255, 255, 0.05)',
        text: '#ffffff', textMuted: 'rgba(255, 255, 255, 0.6)',
        border: 'rgba(255, 255, 255, 0.1)', error: '#f87171',
        success: '#4ade80', accent: '#a855f7'
      },
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: { label: '14px', input: '16px', button: '16px', heading: '24px' },
      spacing: { fieldGap: '20px', padding: '24px' },
      borderRadius: { input: '12px', button: '12px', form: '20px' },
      shadows: true, animation: true
    }
    switch (type) {
      case 'create_form':
        addForm({
          name: payload.name || 'New Form',
          description: payload.description || '',
          fields: payload.fields || [],
          settings: { submitButtonText: payload.settings?.submitButtonText || 'Submit', successMessage: payload.settings?.successMessage || 'Thank you!', collectEmails: true },
          styling: payload.styling || defaultStyling,
          size: { width: 420, height: 500 },
        })
        break
      case 'update_form':
        if (currentForm && payload.updates) updateForm(currentForm.id, payload.updates)
        break
    }
  }, [addForm, updateForm, currentForm])
  // Handle voice button click
  const handleVoiceClick = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening()
    } else if (voiceState === 'ready-to-send') {
      sendMessage()
    } else if (voiceState === 'idle') {
      startListening()
    }
  }, [voiceState, stopListening, sendMessage, startListening])
  // Cancel/clear
  const handleCancel = useCallback(() => {
    recognitionRef.current?.stop()
    synthRef.current?.cancel()
    setTranscript('')
    setInterimTranscript('')
    transcriptRef.current = ''
    setVoiceState('idle')
    setAvatarState('idle')
    setShowTranscript(false)
    setIsRecording(false)
    setDebugInfo('')
  }, [setAvatarState, setIsRecording])
  // Close floating mode
  const closeFloating = useCallback(() => {
    handleCancel()
    setAvatarFloating(false)
    onOpenSidebar()
  }, [handleCancel, setAvatarFloating, onOpenSidebar])
  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAvatarFloating) return
      if (e.key === 'Enter' && voiceState === 'ready-to-send') {
        e.preventDefault()
        sendMessage()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAvatarFloating, voiceState, sendMessage, handleCancel])
  if (!isAvatarFloating) return null
  const circumference = 2 * Math.PI * 52
  const strokeDashoffset = circumference - (progress / 100) * circumference
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        const newPos = {
          x: position.x + info.offset.x,
          y: position.y + info.offset.y
        }
        setPosition(newPos)
        setAvatarPosition(newPos)
      }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.6
        }
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        y: 20,
        transition: { 
          duration: 0.3,
          ease: "easeInOut"
        }
      }}
      className="fixed z-[100] cursor-grab active:cursor-grabbing"
      style={{
        touchAction: 'none',
        left: position.x,
        top: position.y
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Main Avatar Container */}
        <div className="relative">
          {/* Glowing Progress Ring */}
          <svg className="absolute -inset-3 w-[120px] h-[120px]" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            {voiceState === 'processing' && (
              <motion.circle
                cx="60" cy="60" r="52" fill="none" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 60 60)"
                style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' }}
              />
            )}
            {voiceState === 'listening' && (
              <motion.circle
                cx="60" cy="60" r="52" fill="none" stroke="#ef4444" strokeWidth="3"
                animate={{ r: [52, 58, 52], opacity: [0.8, 0.3, 0.8] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))' }}
              />
            )}
            {voiceState === 'speaking' && (
              <>
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke="#06b6d4" strokeWidth="2"
                  animate={{ r: [52, 56, 52], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 0.8, repeat: Infinity }} />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke="#a855f7" strokeWidth="2"
                  animate={{ r: [52, 60, 52], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
              </>
            )}
            {voiceState === 'ready-to-send' && (
              <motion.circle
                cx="60" cy="60" r="52" fill="none" stroke="#22c55e" strokeWidth="3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))' }}
              />
            )}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          {/* Avatar Face */}
          <div className="relative w-[96px] h-[96px] rounded-full bg-gradient-to-br from-space-light to-space overflow-hidden border-2 border-white/20 shadow-2xl">
            <AvatarFace state={avatarState} size={96} />
          </div>
          {/* Action Buttons - Right side of avatar */}
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {/* Main Voice Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceClick}
              disabled={voiceState === 'processing' || voiceState === 'speaking'}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                voiceState === 'listening' ? 'bg-red-500 text-white shadow-red-500/40 animate-pulse' :
                voiceState === 'ready-to-send' ? 'bg-green-500 text-white shadow-green-500/40' :
                voiceState === 'processing' ? 'bg-neon-cyan text-white shadow-neon-cyan/40' :
                voiceState === 'speaking' ? 'bg-neon-purple text-white shadow-neon-purple/40' :
                'bg-white/10 text-white hover:bg-neon-cyan/30 hover:text-neon-cyan'
              }`}
            >
              {voiceState === 'listening' ? <MicOff className="w-5 h-5" /> :
               voiceState === 'ready-to-send' ? <Send className="w-5 h-5" /> :
               voiceState === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> :
               voiceState === 'speaking' ? <Volume2 className="w-5 h-5" /> :
               <Mic className="w-5 h-5" />}
            </motion.button>
            {/* Expand Sidebar */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={closeFloating}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center shadow-lg"
              title="Open full chat"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>
            {/* Upload */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUploadClick}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center shadow-lg"
              title="Upload file"
            >
              <Upload className="w-5 h-5" />
            </motion.button>
            {/* Mute/Unmute */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                isSpeakingEnabled ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/10 text-white/50'
              }`}
              title={isSpeakingEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {isSpeakingEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
        {/* Status Badge - Below avatar */}
        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          voiceState === 'listening' ? 'bg-red-500 text-white animate-pulse' :
          voiceState === 'processing' ? 'bg-neon-cyan text-white' :
          voiceState === 'speaking' ? 'bg-neon-purple text-white' :
          voiceState === 'ready-to-send' ? 'bg-green-500 text-white' :
          'bg-white/10 text-white/60'
        }`}>
          {voiceState === 'listening' ? '🎤 Listening... speak now' :
           voiceState === 'processing' ? '🔄 Working on it...' :
           voiceState === 'speaking' ? '🔊 Speaking...' :
           voiceState === 'ready-to-send' ? '✓ Tap mic to send' :
           '🎤 Tap mic to speak'}
        </div>
        {/* Transcript Bubble - Below status badge */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="mt-3 w-80 bg-space-light/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  voiceState === 'listening' ? 'text-red-400' :
                  voiceState === 'ready-to-send' ? 'text-green-400' :
                  voiceState === 'processing' ? 'text-neon-cyan' :
                  'text-white/50'
                }`}>
                  {voiceState === 'listening' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  {voiceState === 'listening' ? 'Listening... speak now' :
                   voiceState === 'ready-to-send' ? '✓ Press Enter or click Send' :
                   voiceState === 'processing' ? '⏳ Processing...' :
                   'Your message'}
                </span>
                <button onClick={handleCancel} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-3 h-3 text-white/50" />
                </button>
              </div>
              <div className="min-h-[40px] bg-black/20 rounded-lg px-3 py-2">
                {transcript || interimTranscript ? (
                  <p className="text-white text-sm">
                    {transcript}
                    <span className="text-white/40">{interimTranscript}</span>
                  </p>
                ) : (
                  <p className="text-white/30 text-sm italic">
                    {voiceState === 'listening' ? 'Say something...' : 'No speech detected'}
                  </p>
                )}
              </div>
              {debugInfo && (
                <p className="text-[10px] text-white/40 mt-2">{debugInfo}</p>
              )}
              {voiceState === 'ready-to-send' && transcript && (
                <div className="flex gap-2 mt-3">
                  <button onClick={sendMessage}
                    className="flex-1 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/20">
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>
                  <button onClick={startListening}
                    className="py-2 px-3 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5" /> More
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
