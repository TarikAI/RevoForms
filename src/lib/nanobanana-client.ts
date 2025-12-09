// NanoBanana API Integration
// For filling image forms with handwriting, custom fonts, and overlays

export interface NanoBananaConfig {
  apiKey: string
  baseURL: string
}

export interface FillTextRequest {
  image: string // Base64 encoded image
  fills: TextFill[]
  outputFormat?: 'png' | 'jpg' | 'pdf'
  quality?: number // 1-100
}

export interface TextFill {
  text: string
  position: {
    x: number // Pixel or percentage
    y: number
    width?: number
    height?: number
  }
  style: TextStyle
}

export interface TextStyle {
  mode: 'handwriting' | 'font' | 'typewriter'
  // Handwriting options
  handwritingStyle?: 'casual' | 'formal' | 'cursive' | 'print' | 'custom'
  handwritingVariation?: number // 0-1, how much variation in strokes
  // Font options
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | 'light'
  fontStyle?: 'normal' | 'italic'
  // Common options
  color?: string // Hex color
  opacity?: number // 0-1
  rotation?: number // Degrees
  letterSpacing?: number
  lineHeight?: number
}

export interface ImageOverlay {
  image: string // Base64 or URL
  position: { x: number; y: number }
  size?: { width: number; height: number }
  opacity?: number
  rotation?: number
}

export interface FillImageRequest {
  image: string // Base64 encoded source image
  textFills?: TextFill[]
  imageOverlays?: ImageOverlay[]
  outputFormat?: 'png' | 'jpg' | 'pdf'
  quality?: number
}

export interface NanoBananaResponse {
  success: boolean
  image?: string // Base64 encoded result
  imageUrl?: string // URL to result (if hosted)
  error?: string
  processingTime?: number
}

// NanoBanana API Client
export class NanoBananaClient {
  private apiKey: string
  private baseURL: string

  constructor(config?: Partial<NanoBananaConfig>) {
    this.apiKey = config?.apiKey || process.env.NANOBANANA_API_KEY || ''
    this.baseURL = config?.baseURL || process.env.NANOBANANA_BASE_URL || 'https://api.nanobanana.com/v1'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async fillForm(request: FillImageRequest): Promise<NanoBananaResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'NanoBanana API key not configured. Add NANOBANANA_API_KEY to your environment.'
      }
    }

    try {
      const response = await fetch(`${this.baseURL}/fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `API Error: ${response.status} - ${error}` }
      }

      const result = await response.json()
      return { success: true, ...result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async addHandwriting(
    image: string,
    text: string,
    position: { x: number; y: number },
    style?: Partial<TextStyle>
  ): Promise<NanoBananaResponse> {
    return this.fillForm({
      image,
      textFills: [{
        text,
        position,
        style: {
          mode: 'handwriting',
          handwritingStyle: 'casual',
          color: '#000000',
          ...style,
        }
      }]
    })
  }

  async addSignature(
    image: string,
    signatureImage: string,
    position: { x: number; y: number },
    size?: { width: number; height: number }
  ): Promise<NanoBananaResponse> {
    return this.fillForm({
      image,
      imageOverlays: [{
        image: signatureImage,
        position,
        size,
      }]
    })
  }
}

// Singleton instance
let clientInstance: NanoBananaClient | null = null

export function getNanoBananaClient(): NanoBananaClient {
  if (!clientInstance) {
    clientInstance = new NanoBananaClient()
  }
  return clientInstance
}

// Handwriting style presets
export const HANDWRITING_PRESETS = {
  casual: { handwritingStyle: 'casual' as const, handwritingVariation: 0.3 },
  formal: { handwritingStyle: 'formal' as const, handwritingVariation: 0.1 },
  cursive: { handwritingStyle: 'cursive' as const, handwritingVariation: 0.4 },
  print: { handwritingStyle: 'print' as const, handwritingVariation: 0.2 },
  messy: { handwritingStyle: 'casual' as const, handwritingVariation: 0.7 },
  neat: { handwritingStyle: 'print' as const, handwritingVariation: 0.05 },
}

// Font presets for typed fills
export const FONT_PRESETS = {
  typewriter: { fontFamily: 'Courier New', mode: 'typewriter' as const },
  modern: { fontFamily: 'Arial', mode: 'font' as const },
  elegant: { fontFamily: 'Georgia', mode: 'font' as const },
  technical: { fontFamily: 'Consolas', mode: 'font' as const },
}
