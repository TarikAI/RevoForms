/**
 * Image Editing Provider Configuration
 * Primary: NanoBanana API for handwriting, font matching, inpainting
 * Extensible for other image editing APIs
 */

export type ImageEditCapability = 
  | 'inpaint'           // Fill/edit regions
  | 'text-add'          // Add text to images
  | 'text-remove'       // Remove text from images
  | 'style-match'       // Match existing style/font
  | 'handwriting'       // Generate handwriting
  | 'signature'         // Generate signatures
  | 'stamp'             // Add stamps/logos

export interface ImageEditProviderConfig {
  name: string
  apiKey: string
  baseUrl: string
  capabilities: ImageEditCapability[]
  enabled: boolean
}

export interface TextOverlay {
  text: string
  x: number
  y: number
  fontSize?: number
  fontFamily?: string
  color?: string
  rotation?: number
  style?: 'printed' | 'handwritten' | 'match-source'
  sourceRegion?: { x: number; y: number; width: number; height: number }  // For style matching
}

export interface InpaintRegion {
  x: number
  y: number
  width: number
  height: number
  prompt?: string  // What to fill with
}

export interface ImageEditRequest {
  image: string | Buffer  // Base64 or Buffer
  operations: ImageEditOperation[]
}

export type ImageEditOperation = 
  | { type: 'add-text'; config: TextOverlay }
  | { type: 'inpaint'; config: InpaintRegion }
  | { type: 'remove-text'; config: { regions: InpaintRegion[] } }
  | { type: 'add-signature'; config: { name: string; x: number; y: number; style?: string } }
  | { type: 'add-image'; config: { image: string; x: number; y: number; width: number; height: number } }

export interface ImageEditResult {
  success: boolean
  image?: string  // Base64 result
  error?: string
}

// NanoBanana Provider
class NanoBananaProvider {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NANOBANANA_API_KEY || ''
    this.baseUrl = process.env.NANOBANANA_BASE_URL || 'https://api.nanobanana.com/v1'
  }

  get isConfigured(): boolean {
    return !!this.apiKey
  }

  get capabilities(): ImageEditCapability[] {
    return ['inpaint', 'text-add', 'text-remove', 'style-match', 'handwriting', 'signature']
  }

  async editImage(request: ImageEditRequest): Promise<ImageEditResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'NanoBanana API key not configured' }
    }

    try {
      const imageBase64 = Buffer.isBuffer(request.image) 
        ? request.image.toString('base64') 
        : request.image

      const response = await fetch(`${this.baseUrl}/edit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          operations: request.operations,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `NanoBanana error: ${error}` }
      }

      const result = await response.json()
      return { success: true, image: result.image }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async addHandwrittenText(options: {
    image: string | Buffer
    text: string
    position: { x: number; y: number }
    style?: 'casual' | 'formal' | 'match-source'
    sourceRegion?: { x: number; y: number; width: number; height: number }
  }): Promise<ImageEditResult> {
    return this.editImage({
      image: options.image,
      operations: [{
        type: 'add-text',
        config: {
          text: options.text,
          x: options.position.x,
          y: options.position.y,
          style: options.style === 'match-source' ? 'match-source' : 'handwritten',
          sourceRegion: options.sourceRegion,
        }
      }]
    })
  }

  async fillFormField(options: {
    image: string | Buffer
    field: { x: number; y: number; width: number; height: number }
    value: string
    matchStyle?: boolean
    styleSourceRegion?: { x: number; y: number; width: number; height: number }
  }): Promise<ImageEditResult> {
    const operations: ImageEditOperation[] = []

    // First clear the field area
    operations.push({
      type: 'inpaint',
      config: {
        ...options.field,
        prompt: 'blank form field background'
      }
    })

    // Then add the text
    operations.push({
      type: 'add-text',
      config: {
        text: options.value,
        x: options.field.x + 5,
        y: options.field.y + options.field.height / 2,
        style: options.matchStyle ? 'match-source' : 'printed',
        sourceRegion: options.styleSourceRegion,
      }
    })

    return this.editImage({ image: options.image, operations })
  }

  async addSignature(options: {
    image: string | Buffer
    name: string
    position: { x: number; y: number }
    style?: 'cursive' | 'formal' | 'casual'
  }): Promise<ImageEditResult> {
    return this.editImage({
      image: options.image,
      operations: [{
        type: 'add-signature',
        config: {
          name: options.name,
          x: options.position.x,
          y: options.position.y,
          style: options.style || 'cursive'
        }
      }]
    })
  }
}

// Singleton instance
let nanoBananaInstance: NanoBananaProvider | null = null

export function getNanoBananaProvider(): NanoBananaProvider {
  if (!nanoBananaInstance) {
    nanoBananaInstance = new NanoBananaProvider()
  }
  return nanoBananaInstance
}

// Generic image edit function with provider fallback
export async function editImage(request: ImageEditRequest): Promise<ImageEditResult> {
  const nanoBanana = getNanoBananaProvider()
  
  if (nanoBanana.isConfigured) {
    return nanoBanana.editImage(request)
  }

  // Fallback: Return error if no provider available
  return { 
    success: false, 
    error: 'No image editing provider configured. Please add NANOBANANA_API_KEY to environment.' 
  }
}

// Check if image editing is available
export function isImageEditingAvailable(): boolean {
  return getNanoBananaProvider().isConfigured
}
