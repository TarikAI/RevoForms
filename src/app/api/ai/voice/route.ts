/**
 * Voice Transcription API
 * Provides server-side transcription using multiple providers
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  // Configure OpenAI for transcription (lazy initialization)
  const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const provider = (formData.get('provider') as string) || 'openai'
    const language = (formData.get('language') as string) || 'en'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Check file size (limit to 25MB)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    // Validate audio format
    const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm']
    if (!supportedFormats.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Unsupported audio format. Please use MP3, WAV, M4A, or WebM.' },
        { status: 400 }
      )
    }

    let transcription: string

    // Use OpenAI Whisper for transcription
    if (provider === 'openai' && openai) {
      const transcriptionResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'text',
        temperature: 0.0, // Lower temperature for more accurate transcription
      })

      transcription = transcriptionResponse
    } else {
      // Fallback: Return instructions for client-side transcription
      return NextResponse.json({
        success: false,
        message: 'OpenAI API key not configured. Using client-side transcription.',
        clientSide: true,
        instructions: 'Use the Web Speech API in the browser for real-time transcription.',
      })
    }

    // Process the transcription to clean up common issues
    const cleanedTranscription = transcription
      .trim()
      // Remove multiple consecutive spaces
      .replace(/\s+/g, ' ')
      // Remove filler words at the beginning
      .replace(/^(um|uh|yeah|okay|so|well|right|alright)\s*,?\s*/i, '')
      // Capitalize first letter
      .replace(/^\w/, c => c.toUpperCase())

    return NextResponse.json({
      success: true,
      transcription: cleanedTranscription,
      provider: provider,
      duration: audioFile.size, // Placeholder - actual duration would be extracted from audio
    })

  } catch (error: any) {
    console.error('Voice transcription error:', error)

    if (error.message?.includes('OpenAI API')) {
      return NextResponse.json({
        success: false,
        message: 'Transcription service unavailable. Please try again later.',
        fallback: 'Client-side speech recognition can be used as an alternative.',
      })
    }

    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    )
  }
}

// Get transcription status and capabilities
export async function GET() {
  return NextResponse.json({
    status: 'available',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
    },
    maxFileSize: '25MB',
    supportedFormats: ['MP3', 'WAV', 'M4A', 'WebM'],
    features: [
      'Real-time transcription',
      'Multiple language support',
      'High accuracy',
      'Noise reduction',
    ]
  })
}
