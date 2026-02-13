import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateImageBase64, getAvailableProviders } from '@/lib/providers/image-generation-provider'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, width, height, style, returnBase64 } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate image
    const result = returnBase64 
      ? await generateImageBase64({ prompt, width, height, style })
      : await generateImage({ prompt, width, height, style })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Image generation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      provider: result.provider,
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const providers = getAvailableProviders()
  
  return NextResponse.json({
    availableProviders: providers,
    defaultProvider: providers[0],
    message: 'Use POST to generate images',
  })
}
