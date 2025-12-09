'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseSpeechRecognitionOptions {
  onResult?: (text: string) => void
  onInterimResult?: (text: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
  continuous?: boolean
  interimResults?: boolean
  language?: string
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

// Declare SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

/**
 * Hook for using the Web Speech API for voice recognition
 * Works in Chrome, Edge, and Safari (with webkit prefix)
 */
export function useSpeechRecognition({
  onResult,
  onInterimResult,
  onError,
  onEnd,
  continuous = false,
  interimResults = true,
  language = 'en-US'
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = 
      typeof window !== 'undefined' && 
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    
    setIsSupported(!!SpeechRecognitionAPI)
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = language
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interim = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript
          
          if (result.isFinal) {
            finalTranscript += text
          } else {
            interim += text
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          onResult?.(finalTranscript)
        }
        
        if (interim) {
          setInterimTranscript(interim)
          onInterimResult?.(interim)
        }
      }
      
      recognition.onerror = (event) => {
        const errorMsg = event.error || 'Speech recognition error'
        setError(errorMsg)
        setIsListening(false)
        onError?.(errorMsg)
      }
      
      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript('')
        onEnd?.()
        
        // Auto restart if continuous mode
        if (continuous && recognitionRef.current) {
          try {
            recognitionRef.current.start()
            setIsListening(true)
          } catch {
            // Already started or not available
          }
        }
      }
      
      recognitionRef.current = recognition
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [continuous, interimResults, language])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported')
      return
    }
    
    setError(null)
    setInterimTranscript('')
    
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err: any) {
      // May already be running
      if (err.message?.includes('already started')) {
        setIsListening(true)
      } else {
        setError(err.message || 'Failed to start')
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error
  }
}

/**
 * Hook for text-to-speech
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      
      // Get voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
      }
      
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback((text: string, options?: {
    voice?: SpeechSynthesisVoice
    rate?: number
    pitch?: number
    volume?: number
  }) => {
    if (!isSupported || !text) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    if (options?.voice) utterance.voice = options.voice
    if (options?.rate) utterance.rate = options.rate
    if (options?.pitch) utterance.pitch = options.pitch
    if (options?.volume) utterance.volume = options.volume
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSupported])

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause()
    }
  }, [isSupported])

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume()
    }
  }, [isSupported])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices
  }
}
