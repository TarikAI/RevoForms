/**
 * Image Generation Provider with Pollinations Fallback
 * Primary: Configured AI provider
 * Fallback: Pollinations.ai (free, no API key needed)
 */

export interface ImageGenerationRequest {
  prompt: string
  width?: number
  height?: number
  style?: 'realistic' | 'artistic' | 'minimal' | 'corporate'
  seed?: number
}

export interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  imageBase64?: string
  provider: string
  error?: string
}

// Pollinations.ai - Free image generation API
class PollinationsProvider {
  private baseUrl = 'https://image.pollinations.ai/prompt'

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      const { prompt, width = 512, height = 512, seed } = request
      
      // Build the URL with parameters
      const encodedPrompt = encodeURIComponent(prompt)
      let url = `${this.baseUrl}/${encodedPrompt}?width=${width}&height=${height}&nologo=true`
      
      if (seed) {
        url += `&seed=${seed}`
      }

      // Pollinations returns the image directly at this URL
      // We can either return the URL or fetch and convert to base64
      
      // For embedding, return the direct URL (faster)
      return {
        success: true,
        imageUrl: url,
        provider: 'pollinations'
      }
    } catch (error: any) {
      return {
        success: false,
        provider: 'pollinations',
        error: error.message
      }
    }
  }

  async generateImageBase64(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      const { prompt, width = 512, height = 512, seed } = request
      
      const encodedPrompt = encodeURIComponent(prompt)
      let url = `${this.baseUrl}/${encodedPrompt}?width=${width}&height=${height}&nologo=true`
      
      if (seed) {
        url += `&seed=${seed}`
      }

      // Fetch the image and convert to base64
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = response.headers.get('content-type') || 'image/png'

      return {
        success: true,
        imageBase64: `data:${mimeType};base64,${base64}`,
        imageUrl: url,
        provider: 'pollinations'
      }
    } catch (error: any) {
      return {
        success: false,
        provider: 'pollinations',
        error: error.message
      }
    }
  }
}

// OpenAI DALL-E Provider (if configured)
class DallEProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  get isConfigured(): boolean {
    return !!this.apiKey
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.isConfigured) {
      return { success: false, provider: 'dalle', error: 'OpenAI API key not configured' }
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: request.prompt,
          n: 1,
          size: `${request.width || 1024}x${request.height || 1024}`,
          response_format: 'url'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'DALL-E generation failed')
      }

      const result = await response.json()
      return {
        success: true,
        imageUrl: result.data[0].url,
        provider: 'dalle'
      }
    } catch (error: any) {
      return { success: false, provider: 'dalle', error: error.message }
    }
  }
}

// Stability AI Provider (if configured)
class StabilityProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.STABILITY_API_KEY || ''
  }

  get isConfigured(): boolean {
    return !!this.apiKey
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.isConfigured) {
      return { success: false, provider: 'stability', error: 'Stability API key not configured' }
    }

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: request.prompt, weight: 1 }],
          cfg_scale: 7,
          height: request.height || 1024,
          width: request.width || 1024,
          samples: 1,
          steps: 30,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Stability AI generation failed')
      }

      const result = await response.json()
      return {
        success: true,
        imageBase64: `data:image/png;base64,${result.artifacts[0].base64}`,
        provider: 'stability'
      }
    } catch (error: any) {
      return { success: false, provider: 'stability', error: error.message }
    }
  }
}

// Singleton instances
let pollinationsInstance: PollinationsProvider | null = null
let dalleInstance: DallEProvider | null = null
let stabilityInstance: StabilityProvider | null = null

function getPollinationsProvider(): PollinationsProvider {
  if (!pollinationsInstance) {
    pollinationsInstance = new PollinationsProvider()
  }
  return pollinationsInstance
}

function getDallEProvider(): DallEProvider {
  if (!dalleInstance) {
    dalleInstance = new DallEProvider()
  }
  return dalleInstance
}

function getStabilityProvider(): StabilityProvider {
  if (!stabilityInstance) {
    stabilityInstance = new StabilityProvider()
  }
  return stabilityInstance
}

/**
 * Generate an image with automatic provider fallback
 * Priority: DALL-E -> Stability -> Pollinations (free fallback)
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  // Try DALL-E first if configured
  const dalle = getDallEProvider()
  if (dalle.isConfigured) {
    const result = await dalle.generateImage(request)
    if (result.success) return result
    console.warn('DALL-E failed, trying fallback:', result.error)
  }

  // Try Stability AI if configured
  const stability = getStabilityProvider()
  if (stability.isConfigured) {
    const result = await stability.generateImage(request)
    if (result.success) return result
    console.warn('Stability AI failed, trying fallback:', result.error)
  }

  // Always fall back to Pollinations (free, no API key needed)
  const pollinations = getPollinationsProvider()
  return pollinations.generateImage(request)
}

/**
 * Generate image and return as base64
 */
export async function generateImageBase64(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  // Try configured providers first
  const dalle = getDallEProvider()
  if (dalle.isConfigured) {
    const result = await dalle.generateImage(request)
    if (result.success && result.imageUrl) {
      // Fetch and convert to base64
      try {
        const response = await fetch(result.imageUrl)
        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return { ...result, imageBase64: `data:image/png;base64,${base64}` }
      } catch (e) {
        console.warn('Failed to convert DALL-E image to base64')
      }
    }
  }

  // Pollinations can return base64 directly
  return getPollinationsProvider().generateImageBase64(request)
}

/**
 * Quick helper for form-related images
 */
export async function generateFormImage(formName: string, style: ImageGenerationRequest['style'] = 'minimal'): Promise<ImageGenerationResult> {
  const stylePrompts = {
    realistic: 'professional photograph, high quality, business',
    artistic: 'artistic illustration, colorful, creative',
    minimal: 'minimal, clean, simple shapes, professional',
    corporate: 'corporate style, business, professional, clean'
  }

  return generateImage({
    prompt: `${formName} form concept, ${stylePrompts[style]}, modern design`,
    width: 800,
    height: 600,
    style
  })
}

/**
 * Check which providers are available
 */
export function getAvailableProviders(): string[] {
  const providers: string[] = ['pollinations'] // Always available
  
  if (getDallEProvider().isConfigured) providers.unshift('dalle')
  if (getStabilityProvider().isConfigured) providers.unshift('stability')
  
  return providers
}
