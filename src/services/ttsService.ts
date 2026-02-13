/**
 * Text-to-Speech Service
 *
 * Supports multiple TTS providers with graceful fallback:
 * 1. Browser TTS (free, built-in)
 * 2. ElevenLabs (premium, high quality)
 * 3. OpenAI TTS (premium, high quality)
 *
 * Also generates viseme data for lip synchronization
 */

import { textToVisemes } from '@/lib/visemes'
import type { VisemeName } from '@/lib/visemes'

export type TTSProvider = 'browser' | 'elevenlabs' | 'openai'

export interface TTSOptions {
  provider?: TTSProvider
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
  onViseme?: (viseme: VisemeName, duration: number) => void
  onBoundary?: (index: number, text: string) => void
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface TTSResult {
  audio?: ArrayBuffer
  duration: number
  visemes: Array<{
    viseme: VisemeName
    startTime: number
    endTime: number
  }>
}

export interface Voice {
  id: string
  name: string
  lang: string
  provider: TTSProvider
  gender?: 'male' | 'female' | 'neutral'
}

/**
 * Browser TTS Service (Free, Built-in)
 */
class BrowserTTS {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices() {
    if (!this.synth) return

    // Browser loads voices asynchronously
    const load = () => {
      this.voices = this.synth!.getVoices()
    }

    load()
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load
    }
  }

  getVoices(): Voice[] {
    return this.voices.map(voice => ({
      id: voice.name,
      name: voice.name,
      lang: voice.lang,
      provider: 'browser',
    }))
  }

  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Cancel any ongoing speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      utterance.rate = options.rate ?? 1.0
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0

      // Set voice
      if (options.voice) {
        const voice = this.voices.find(v => v.name === options.voice)
        if (voice) utterance.voice = voice
      }

      utterance.onstart = () => {
        options.onStart?.()
      }

      utterance.onend = () => {
        options.onEnd?.()
        resolve()
      }

      utterance.onerror = (event) => {
        options.onError?.(new Error(event.error))
        reject(new Error(event.error))
      }

      // Generate viseme timeline
      const visemes = textToVisemes(text)
      const visemeDuration = (text.length / visemes.length) * 50 // Approximate

      visemes.forEach((viseme, index) => {
        setTimeout(() => {
          options.onViseme?.(viseme, visemeDuration)
        }, index * visemeDuration)
      })

      this.synth.speak(utterance)
    })
  }

  cancel() {
    this.synth?.cancel()
  }

  pause() {
    this.synth?.pause()
  }

  resume() {
    this.synth?.resume()
  }
}

/**
 * ElevenLabs TTS Service (Premium)
 */
class ElevenLabsTTS {
  private apiKey: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null
    }
  }

  isAvailable(): boolean {
    return this.apiKey !== null
  }

  getVoices(): Voice[] {
    // Return common ElevenLabs voices
    return [
      { id: 'eleven_multilingual_v2', name: 'Multilingual v2', lang: 'en', provider: 'elevenlabs' },
      { id: 'eleven_turbo_v2', name: 'Turbo v2', lang: 'en', provider: 'elevenlabs' },
      { id: 'eleven_monolingual_v1', name: 'Monolingual v1', lang: 'en', provider: 'elevenlabs' },
      { id: 'rachel', name: 'Rachel', lang: 'en', provider: 'elevenlabs', gender: 'female' },
      { id: 'drew', name: 'Drew', lang: 'en', provider: 'elevenlabs', gender: 'male' },
      { id: 'clyde', name: 'Clyde', lang: 'en', provider: 'elevenlabs', gender: 'male' },
      { id: 'mimi', name: 'Mimi', lang: 'en', provider: 'elevenlabs', gender: 'female' },
      { id: 'fin', name: 'Fin', lang: 'en', provider: 'elevenlabs', gender: 'male' },
    ]
  }

  async getAudio(text: string, voiceId: string = 'eleven_multilingual_v2'): Promise<TTSResult> {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured')
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    const audio = await response.arrayBuffer()

    // Generate viseme timeline
    const visemes = textToVisemes(text)
    const estimatedDuration = audio.byteLength / 8000 // Rough estimate
    const visemeDuration = estimatedDuration / visemes.length

    const visemeTimeline = visemes.map((viseme, index) => ({
      viseme,
      startTime: index * visemeDuration,
      endTime: (index + 1) * visemeDuration,
    }))

    return {
      audio,
      duration: estimatedDuration,
      visemes: visemeTimeline,
    }
  }
}

/**
 * OpenAI TTS Service (Premium)
 */
class OpenAITTS {
  private apiKey: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || null
    }
  }

  isAvailable(): boolean {
    return this.apiKey !== null
  }

  getVoices(): Voice[] {
    return [
      { id: 'alloy', name: 'Alloy', lang: 'en', provider: 'openai', gender: 'neutral' },
      { id: 'echo', name: 'Echo', lang: 'en', provider: 'openai', gender: 'male' },
      { id: 'fable', name: 'Fable', lang: 'en', provider: 'openai', gender: 'male' },
      { id: 'onyx', name: 'Onyx', lang: 'en', provider: 'openai', gender: 'male' },
      { id: 'nova', name: 'Nova', lang: 'en', provider: 'openai', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', lang: 'en', provider: 'openai', gender: 'female' },
    ]
  }

  async getAudio(text: string, voice: string = 'alloy'): Promise<TTSResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const audio = await response.arrayBuffer()

    // Generate viseme timeline
    const visemes = textToVisemes(text)
    const estimatedDuration = audio.byteLength / 8000 // Rough estimate
    const visemeDuration = estimatedDuration / visemes.length

    const visemeTimeline = visemes.map((viseme, index) => ({
      viseme,
      startTime: index * visemeDuration,
      endTime: (index + 1) * visemeDuration,
    }))

    return {
      audio,
      duration: estimatedDuration,
      visemes: visemeTimeline,
    }
  }
}

/**
 * Main TTS Service class
 */
export class TTSService {
  private browser: BrowserTTS
  private elevenlabs: ElevenLabsTTS
  private openai: OpenAITTS
  private currentProvider: TTSProvider
  private audioContext: AudioContext | null = null
  private currentSource: AudioBufferSourceNode | null = null

  constructor(defaultProvider: TTSProvider = 'browser') {
    this.browser = new BrowserTTS()
    this.elevenlabs = new ElevenLabsTTS()
    this.openai = new OpenAITTS()
    this.currentProvider = defaultProvider
  }

  getVoices(): Voice[] {
    switch (this.currentProvider) {
      case 'browser':
        return this.browser.getVoices()
      case 'elevenlabs':
        return this.elevenlabs.getVoices()
      case 'openai':
        return this.openai.getVoices()
    }
  }

  setProvider(provider: TTSProvider) {
    this.currentProvider = provider
  }

  getProvider(): TTSProvider {
    return this.currentProvider
  }

  /**
   * Speak text using the selected provider
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    const provider = options.provider ?? this.currentProvider

    if (provider === 'browser') {
      return this.browser.speak(text, options)
    }

    // For premium providers, fetch audio and play it
    let result: TTSResult

    if (provider === 'elevenlabs') {
      result = await this.elevenlabs.getAudio(text, options.voice)
    } else if (provider === 'openai') {
      result = await this.openai.getAudio(text, options.voice)
    } else {
      throw new Error(`Unknown provider: ${provider}`)
    }

    if (!result.audio) {
      throw new Error('No audio data returned')
    }

    // Play audio
    await this.playAudio(result.audio, result.visemes, options)
  }

  /**
   * Play audio buffer with viseme callbacks
   */
  private async playAudio(
    audio: ArrayBuffer,
    visemes: Array<{ viseme: VisemeName; startTime: number; endTime: number }>,
    options: TTSOptions
  ): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Stop any currently playing audio
    this.stop()

    const audioBuffer = await this.audioContext.decodeAudioData(audio)
    this.currentSource = this.audioContext.createBufferSource()
    this.currentSource.buffer = audioBuffer
    this.currentSource.connect(this.audioContext.destination)

    options.onStart?.()

    // Schedule viseme callbacks
    const startTime = this.audioContext.currentTime
    visemes.forEach(({ viseme, startTime: vStartTime }) => {
      const absoluteTime = startTime + vStartTime
      const delay = (absoluteTime - this.audioContext!.currentTime) * 1000

      setTimeout(() => {
        const duration = visemes.find(v => v.viseme === viseme)?.endTime ?? 100
        options.onViseme?.(viseme, duration)
      }, Math.max(0, delay))
    })

    this.currentSource.onended = () => {
      options.onEnd?.()
      this.currentSource = null
    }

    this.currentSource.start()
  }

  /**
   * Stop current speech
   */
  stop() {
    this.browser.cancel()

    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (e) {
        // Already stopped
      }
      this.currentSource = null
    }
  }

  /**
   * Pause current speech (browser TTS only)
   */
  pause() {
    this.browser.pause()
  }

  /**
   * Resume speech (browser TTS only)
   */
  resume() {
    this.browser.resume()
  }

  /**
   * Get visemes for text without speaking
   */
  getVisemes(text: string): Array<{ viseme: VisemeName; startTime: number; endTime: number }> {
    const visemes = textToVisemes(text)
    const estimatedDuration = text.length * 50 // Rough estimate: 50ms per character
    const visemeDuration = estimatedDuration / visemes.length

    return visemes.map((viseme, index) => ({
      viseme,
      startTime: index * visemeDuration,
      endTime: (index + 1) * visemeDuration,
    }))
  }
}

// Singleton instance
let ttsInstance: TTSService | null = null

export function getTTS(): TTSService {
  if (!ttsInstance) {
    ttsInstance = new TTSService()
  }
  return ttsInstance
}
