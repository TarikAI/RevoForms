import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Configure OpenAI for voice transcription
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Alternative providers
const PROVIDERS = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'whisper-1',
  },
  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY,
    endpoint: 'https://api.deepgram.com/v1/listen',
  },
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY,
    endpoint: 'https://api.assemblyai.com/v2/transcript',
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const provider = (formData.get('provider') as string) || 'openai'
    const language = (formData.get('language') as string) || 'en'

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
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

    // Try different providers based on configuration
    switch (provider) {
      case 'openai':
        transcription = await transcribeWithOpenAI(audioFile)
        break
      case 'deepgram':
        transcription = await transcribeWithDeepgram(audioFile, language)
        break
      case 'assemblyai':
        transcription = await transcribeWithAssemblyAI(audioFile)
        break
      default:
        // Fallback to OpenAI
        transcription = await transcribeWithOpenAI(audioFile)
    }

    // Process the transcription to clean up common issues
    const cleanedTranscription = cleanTranscription(transcription)

    return NextResponse.json({
      success: true,
      transcription: cleanedTranscription,
      provider: provider,
      duration: audioFile.size, // Placeholder - actual duration would be extracted from audio
    })

  } catch (error) {
    console.error('Voice transcription error:', error)
    return NextResponse.json(
      {
        error: 'Failed to transcribe audio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// OpenAI Whisper transcription
async function transcribeWithOpenAI(audioFile: File): Promise<string> {
  if (!PROVIDERS.openai.apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: PROVIDERS.openai.model,
      language: 'en',
      response_format: 'text',
      temperature: 0.0, // Lower temperature for more accurate transcription
    })

    return transcription
  } catch (error) {
    console.error('OpenAI transcription error:', error)
    throw new Error('Failed to transcribe with OpenAI')
  }
}

// Deepgram transcription (alternative provider)
async function transcribeWithDeepgram(audioFile: File, language: string): Promise<string> {
  if (!PROVIDERS.deepgram.apiKey) {
    throw new Error('Deepgram API key not configured')
  }

  try {
    const response = await fetch(
      `${PROVIDERS.deepgram.endpoint}?model=nova-2&language=${language}&smart_format=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${PROVIDERS.deepgram.apiKey}`,
          'Content-Type': audioFile.type,
        },
        body: audioFile,
      }
    )

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
  } catch (error) {
    console.error('Deepgram transcription error:', error)
    throw new Error('Failed to transcribe with Deepgram')
  }
}

// AssemblyAI transcription (another alternative)
async function transcribeWithAssemblyAI(audioFile: File): Promise<string> {
  if (!PROVIDERS.assemblyai.apiKey) {
    throw new Error('AssemblyAI API key not configured')
  }

  try {
    // Upload audio file
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': PROVIDERS.assemblyai.apiKey,
      },
      body: audioFile,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio to AssemblyAI')
    }

    const { upload_url } = await uploadResponse.json()

    // Request transcription
    const transcriptResponse = await fetch(PROVIDERS.assemblyai.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': PROVIDERS.assemblyai.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        auto_highlights: true,
        auto_chapters: true,
        sentiment_analysis: true,
      }),
    })

    if (!transcriptResponse.ok) {
      throw new Error('Failed to start transcription')
    }

    const { id } = await transcriptResponse.json()

    // Poll for completion
    let transcript = null
    while (!transcript || transcript.status === 'processing' || transcript.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const pollingResponse = await fetch(`${PROVIDERS.assemblyai.endpoint}/${id}`, {
        headers: {
          'Authorization': PROVIDERS.assemblyai.apiKey,
        },
      })

      transcript = await pollingResponse.json()
    }

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`)
    }

    return transcript.text
  } catch (error) {
    console.error('AssemblyAI transcription error:', error)
    throw new Error('Failed to transcribe with AssemblyAI')
  }
}

// Clean up transcription text
function cleanTranscription(text: string): string {
  return text
    .trim()
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Remove filler words at the beginning
    .replace(/^(um|uh|yeah|okay|so|well|right|alright)\s*,?\s*/i, '')
    // Capitalize first letter
    .replace(/^\w/, c => c.toUpperCase())
    // Ensure proper sentence endings
    .replace(/([.!?])\s*([a-z])/g, '$1 $2'.toUpperCase())
}

// Get transcription status (for long-running transcriptions)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'available',
    providers: Object.keys(PROVIDERS).filter(key => PROVIDERS[key as keyof typeof PROVIDERS].apiKey),
    maxFileSize: '25MB',
    supportedFormats: ['MP3', 'WAV', 'M4A', 'WebM'],
  })
}