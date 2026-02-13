/**
 * Text-to-Speech API Route
 *
 * Provides server-side TTS generation with viseme data
 * Supports multiple providers: ElevenLabs, OpenAI
 */

import { NextRequest, NextResponse } from 'next/server'
import { textToVisemes } from '@/lib/visemes'

export async function POST(request: NextRequest) {
  try {
    const { text, provider = 'browser', voice, options = {} } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      )
    }

    // For browser TTS, just return visemes
    if (provider === 'browser') {
      const visemes = textToVisemes(text)
      const estimatedDuration = text.length * 60 // 60ms per character estimate

      const visemeTimeline = visemes.map((viseme, index) => ({
        viseme,
        startTime: index * (estimatedDuration / visemes.length),
        endTime: (index + 1) * (estimatedDuration / visemes.length),
      }))

      return NextResponse.json({
        provider: 'browser',
        duration: estimatedDuration,
        visemes: visemeTimeline,
        message: 'Use browser SpeechSynthesis for audio playback'
      })
    }

    // ElevenLabs TTS
    if (provider === 'elevenlabs') {
      const apiKey = process.env.ELEVENLABS_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'ElevenLabs API key not configured' },
          { status: 500 }
        )
      }

      const voiceId = voice || 'eleven_multilingual_v2'

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability ?? 0.5,
            similarity_boost: options.similarity_boost ?? 0.5,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return NextResponse.json(
          { error: `ElevenLabs API error: ${error}` },
          { status: response.status }
        )
      }

      const audioBuffer = await response.arrayBuffer()
      const base64Audio = Buffer.from(audioBuffer).toString('base64')

      // Generate viseme timeline
      const visemes = textToVisemes(text)
      const estimatedDuration = audioBuffer.byteLength / 8000 // Rough estimate

      const visemeTimeline = visemes.map((viseme, index) => ({
        viseme,
        startTime: index * (estimatedDuration / visemes.length),
        endTime: (index + 1) * (estimatedDuration / visemes.length),
      }))

      return NextResponse.json({
        provider: 'elevenlabs',
        audio: `data:audio/mpeg;base64,${base64Audio}`,
        duration: estimatedDuration,
        visemes: visemeTimeline,
      })
    }

    // OpenAI TTS
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        )
      }

      const voiceId = voice || 'alloy'

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voiceId,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return NextResponse.json(
          { error: `OpenAI API error: ${error}` },
          { status: response.status }
        )
      }

      const audioBuffer = await response.arrayBuffer()
      const base64Audio = Buffer.from(audioBuffer).toString('base64')

      // Generate viseme timeline
      const visemes = textToVisemes(text)
      const estimatedDuration = audioBuffer.byteLength / 8000 // Rough estimate

      const visemeTimeline = visemes.map((viseme, index) => ({
        viseme,
        startTime: index * (estimatedDuration / visemes.length),
        endTime: (index + 1) * (estimatedDuration / visemes.length),
      }))

      return NextResponse.json({
        provider: 'openai',
        audio: `data:audio/mpeg;base64,${base64Audio}`,
        duration: estimatedDuration,
        visemes: visemeTimeline,
      })
    }

    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('[TTS API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve available voices
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get('provider') || 'browser'

  const voices: Record<string, Array<{ id: string; name: string; lang: string; gender?: string }>> = {
    browser: [
      // Browser voices are client-side, this is just metadata
      { id: 'default', name: 'Default Browser Voice', lang: 'en-US' }
    ],
    elevenlabs: [
      { id: 'eleven_multilingual_v2', name: 'Multilingual v2', lang: 'en' },
      { id: 'eleven_turbo_v2', name: 'Turbo v2', lang: 'en' },
      { id: 'eleven_monolingual_v1', name: 'Monolingual v1', lang: 'en' },
      { id: 'rachel', name: 'Rachel', lang: 'en', gender: 'female' },
      { id: 'drew', name: 'Drew', lang: 'en', gender: 'male' },
      { id: 'clyde', name: 'Clyde', lang: 'en', gender: 'male' },
      { id: 'mimi', name: 'Mimi', lang: 'en', gender: 'female' },
      { id: 'fin', name: 'Fin', lang: 'en', gender: 'male' },
    ],
    openai: [
      { id: 'alloy', name: 'Alloy', lang: 'en', gender: 'neutral' },
      { id: 'echo', name: 'Echo', lang: 'en', gender: 'male' },
      { id: 'fable', name: 'Fable', lang: 'en', gender: 'male' },
      { id: 'onyx', name: 'Onyx', lang: 'en', gender: 'male' },
      { id: 'nova', name: 'Nova', lang: 'en', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', lang: 'en', gender: 'female' },
    ],
  }

  return NextResponse.json({
    provider,
    voices: voices[provider] || [],
  })
}
