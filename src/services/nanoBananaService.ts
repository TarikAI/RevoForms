/**
 * NanoBanana Service - AI Image Editing
 * Adds handwriting, custom fonts, signatures, and images to form images
 */

import type { 
  NanoBananaConfig, 
  NanoBananaEditRequest, 
  NanoBananaEdit,
  NanoBananaResponse 
} from '@/types/upload'

class NanoBananaService {
  private apiKey: string | null = null
  private baseUrl: string = 'https://api.nanobanana.com/v1' // Placeholder URL
  private isConfigured: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    this.apiKey = process.env.NANOBANANA_API_KEY || null
    this.baseUrl = process.env.NANOBANANA_BASE_URL || this.baseUrl
    this.isConfigured = !!this.apiKey
  }

  /**
   * Check if NanoBanana is configured
   */
  isAvailable(): boolean {
    return this.isConfigured
  }

  /**
   * Configure NanoBanana with API key
   */
  configure(config: NanoBananaConfig) {
    this.apiKey = config.apiKey
    if (config.baseUrl) this.baseUrl = config.baseUrl
    this.isConfigured = true
  }

  /**
   * Edit an image with text, signatures, or other elements
   */
  async editImage(request: NanoBananaEditRequest): Promise<NanoBananaResponse> {
    if (!this.isConfigured) {
      // Return mock response for development/demo
      return this.mockEdit(request)
    }

    try {
      const response = await fetch(`${this.baseUrl}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          image: request.image,
          edits: request.edits.map(edit => this.formatEdit(edit))
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`NanoBanana API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return {
        success: true,
        editedImage: data.result || data.image
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit image'
      }
    }
  }

  /**
   * Add handwritten text to an image
   */
  async addHandwriting(
    imageBase64: string,
    text: string,
    position: { x: number; y: number },
    style?: {
      handwritingStyle?: 'casual' | 'formal' | 'cursive' | 'print'
      color?: string
      fontSize?: number
    }
  ): Promise<NanoBananaResponse> {
    return this.editImage({
      image: imageBase64,
      edits: [{
        type: 'text',
        position,
        content: text,
        style: {
          handwriting: true,
          handwritingStyle: style?.handwritingStyle || 'casual',
          color: style?.color || '#000000',
          fontSize: style?.fontSize || 14
        }
      }]
    })
  }

  /**
   * Add a signature to an image
   */
  async addSignature(
    imageBase64: string,
    signatureName: string,
    position: { x: number; y: number },
    bounds?: { width: number; height: number }
  ): Promise<NanoBananaResponse> {
    return this.editImage({
      image: imageBase64,
      edits: [{
        type: 'signature',
        position,
        content: signatureName,
        bounds,
        style: {
          handwriting: true,
          handwritingStyle: 'cursive'
        }
      }]
    })
  }

  /**
   * Add an image/stamp/logo to an image
   */
  async addImage(
    backgroundImage: string,
    overlayImage: string,
    position: { x: number; y: number },
    bounds?: { width: number; height: number },
    opacity?: number
  ): Promise<NanoBananaResponse> {
    return this.editImage({
      image: backgroundImage,
      edits: [{
        type: 'image',
        position,
        content: overlayImage,
        bounds,
        style: { opacity: opacity || 1 }
      }]
    })
  }

  /**
   * Fill a form image with provided field values
   */
  async fillFormImage(
    formImage: string,
    fieldValues: Array<{
      text: string
      position: { x: number; y: number }
      style?: NanoBananaEdit['style']
    }>
  ): Promise<NanoBananaResponse> {
    const edits: NanoBananaEdit[] = fieldValues.map(field => ({
      type: 'text' as const,
      position: field.position,
      content: field.text,
      style: {
        handwriting: field.style?.handwriting ?? false,
        fontSize: field.style?.fontSize || 12,
        color: field.style?.color || '#000000',
        ...field.style
      }
    }))

    return this.editImage({ image: formImage, edits })
  }

  /**
   * Format edit for API
   */
  private formatEdit(edit: NanoBananaEdit): any {
    return {
      type: edit.type,
      x: edit.position.x,
      y: edit.position.y,
      content: edit.content,
      width: edit.bounds?.width,
      height: edit.bounds?.height,
      font: edit.style?.font,
      font_size: edit.style?.fontSize,
      color: edit.style?.color,
      handwriting: edit.style?.handwriting,
      handwriting_style: edit.style?.handwritingStyle,
      rotation: edit.style?.rotation,
      opacity: edit.style?.opacity
    }
  }

  /**
   * Mock edit for development/demo mode with actual canvas implementation
   */
  private async mockEdit(request: NanoBananaEditRequest): Promise<NanoBananaResponse> {
    // In development mode without API key, we'll use HTML5 Canvas to apply edits

    // Load the image
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = request.image
    })

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = img.width
    canvas.height = img.height

    // Draw the original image
    ctx.drawImage(img, 0, 0)

    // Apply each edit
    for (const edit of request.edits) {
      const position = edit.position

      // Set font properties
      if (edit.type === 'typed') {
        ctx.font = `${edit.style?.fontSize || 24}px ${edit.style?.fontFamily || 'Arial'}`
        ctx.fillStyle = edit.style?.color || '#000000'
        ctx.globalAlpha = edit.style?.opacity || 1

        // Add text shadow if specified
        if (edit.style?.textShadow) {
          ctx.shadowColor = edit.style.textShadow.color || 'rgba(0,0,0,0.5)'
          ctx.shadowBlur = edit.style.textShadow.blur || 4
          ctx.shadowOffsetX = edit.style.textShadow.x || 2
          ctx.shadowOffsetY = edit.style.textShadow.y || 2
        }

        // Apply rotation if specified
        if (edit.style?.rotation) {
          ctx.save()
          ctx.translate(position.x, position.y)
          ctx.rotate((edit.style.rotation * Math.PI) / 180)
          ctx.fillText(edit.content!, -ctx.measureText(edit.content!).width / 2, 0)
          ctx.restore()
        } else {
          ctx.fillText(edit.content!, position.x, position.y)
        }

        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

      } else if (edit.type === 'handwriting') {
        // Simulate handwriting with a more organic font
        const handwritingFonts = {
          casual: 'Comic Sans MS, cursive',
          formal: 'Brush Script MT, cursive',
          cursive: 'Dancing Script, cursive',
          print: 'Georgia, serif',
          signature: 'Brush Script MT, cursive'
        }

        ctx.font = `${edit.style?.fontSize || 28}px ${handwritingFonts[edit.style?.handwritingStyle as keyof typeof handwritingFonts] || 'cursive'}`
        ctx.fillStyle = edit.style?.color || '#000033'
        ctx.globalAlpha = edit.style?.opacity || 1

        // Add slight randomness for more natural look
        const jitter = 2
        const x = position.x + (Math.random() - 0.5) * jitter
        const y = position.y + (Math.random() - 0.5) * jitter

        ctx.fillText(edit.content!, x, y)
      }
    }

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve({
              success: true,
              editedImage: reader.result as string
            })
          }
          reader.readAsDataURL(blob)
        } else {
          // Fallback to original image
          resolve({
            success: true,
            editedImage: request.image
          })
        }
      }, 'image/png', 0.9)
    })
  }

  /**
   * Get available handwriting styles
   */
  getHandwritingStyles(): Array<{ id: string; name: string; preview?: string }> {
    return [
      { id: 'casual', name: 'Casual Handwriting' },
      { id: 'formal', name: 'Formal Script' },
      { id: 'cursive', name: 'Cursive' },
      { id: 'print', name: 'Print Style' },
      { id: 'signature', name: 'Signature Style' }
    ]
  }

  /**
   * Get available fonts for typed text
   */
  getFonts(): Array<{ id: string; name: string }> {
    return [
      { id: 'arial', name: 'Arial' },
      { id: 'times', name: 'Times New Roman' },
      { id: 'courier', name: 'Courier New' },
      { id: 'helvetica', name: 'Helvetica' },
      { id: 'georgia', name: 'Georgia' }
    ]
  }
}

// Export singleton instance
export const nanoBananaService = new NanoBananaService()
