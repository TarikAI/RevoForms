// ============================================
// NANOBANANA IMAGE EDITOR SERVICE
// Fills form images with handwriting, custom fonts, etc.
// ============================================

import { getAIProviders, getPrimaryProvider } from '../ai/providers'

export interface HandwritingStyle {
  id: string
  name: string
  preview?: string
}

export interface FillRequest {
  imageBase64: string
  mimeType: string
  fields: {
    x: number
    y: number
    width: number
    height: number
    value: string
    style?: 'handwriting' | 'typewriter' | 'custom'
    fontFamily?: string
    fontSize?: number
    color?: string
  }[]
  options?: {
    handwritingStyle?: string
    preserveQuality?: boolean
    outputFormat?: 'png' | 'jpg' | 'pdf'
  }
}

export interface FillResult {
  success: boolean
  imageBase64?: string
  mimeType?: string
  error?: string
}

export interface ImageEditRequest {
  imageBase64: string
  mimeType: string
  edits: {
    type: 'text' | 'image' | 'draw' | 'erase'
    x: number
    y: number
    width?: number
    height?: number
    content?: string  // Text content or base64 image
    style?: Record<string, any>
  }[]
}

// Check if NanoBanana is configured
export function isNanoBananaConfigured(): boolean {
  const providers = getAIProviders()
  return providers.image.some(p => p.name === 'nanobanana')
}

// Fill form image with text
export async function fillFormImage(request: FillRequest): Promise<FillResult> {
  const providers = getAIProviders()
  const nanoBanana = providers.image.find(p => p.name === 'nanobanana')
  
  if (!nanoBanana) {
    return {
      success: false,
      error: 'NanoBanana API not configured. Add NANOBANANA_API_KEY to your environment.'
    }
  }

  try {
    const response = await fetch(`${nanoBanana.baseURL}/fill-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBanana.apiKey}`,
      },
      body: JSON.stringify({
        image: request.imageBase64,
        mime_type: request.mimeType,
        fields: request.fields,
        options: request.options
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`NanoBanana API error: ${error}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      imageBase64: result.image,
      mimeType: result.mime_type || request.mimeType
    }
  } catch (error: any) {
    console.error('NanoBanana fill error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fill form image'
    }
  }
}

// Edit image with various operations
export async function editImage(request: ImageEditRequest): Promise<FillResult> {
  const providers = getAIProviders()
  const nanoBanana = providers.image.find(p => p.name === 'nanobanana')
  
  if (!nanoBanana) {
    return {
      success: false,
      error: 'NanoBanana API not configured'
    }
  }

  try {
    const response = await fetch(`${nanoBanana.baseURL}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBanana.apiKey}`,
      },
      body: JSON.stringify({
        image: request.imageBase64,
        mime_type: request.mimeType,
        edits: request.edits
      })
    })

    if (!response.ok) {
      throw new Error(`NanoBanana API error: ${response.status}`)
    }

    const result = await response.json()
    
    return {
      success: true,
      imageBase64: result.image,
      mimeType: result.mime_type || request.mimeType
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Get available handwriting styles
export async function getHandwritingStyles(): Promise<HandwritingStyle[]> {
  const providers = getAIProviders()
  const nanoBanana = providers.image.find(p => p.name === 'nanobanana')
  
  if (!nanoBanana) {
    return [
      { id: 'default', name: 'Default Handwriting' },
      { id: 'neat', name: 'Neat Handwriting' },
      { id: 'cursive', name: 'Cursive' },
      { id: 'casual', name: 'Casual' }
    ]
  }

  try {
    const response = await fetch(`${nanoBanana.baseURL}/styles`, {
      headers: { 'Authorization': `Bearer ${nanoBanana.apiKey}` }
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // Return defaults on error
  }
  
  return [
    { id: 'default', name: 'Default Handwriting' },
    { id: 'neat', name: 'Neat Handwriting' },
    { id: 'cursive', name: 'Cursive' }
  ]
}

// Generate handwriting sample from user's uploaded sample
export async function trainHandwritingStyle(
  sampleImageBase64: string,
  styleName: string
): Promise<{ success: boolean; styleId?: string; error?: string }> {
  const providers = getAIProviders()
  const nanoBanana = providers.image.find(p => p.name === 'nanobanana')
  
  if (!nanoBanana) {
    return { success: false, error: 'NanoBanana API not configured' }
  }

  try {
    const response = await fetch(`${nanoBanana.baseURL}/train-style`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBanana.apiKey}`,
      },
      body: JSON.stringify({
        sample: sampleImageBase64,
        name: styleName
      })
    })

    if (!response.ok) {
      throw new Error('Style training failed')
    }

    const result = await response.json()
    return { success: true, styleId: result.style_id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
