import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractPDFStructure, fillPDFForm } from '@/lib/pdf-utils'
import { getVisionProviders, VISION_FORM_ANALYSIS_PROMPT, type VisionAnalysisResult } from '@/lib/vision-providers'
import { getNanoBananaClient, type FillImageRequest, type TextFill } from '@/lib/nanobanana-client'

export const runtime = 'nodejs'
export const maxDuration = 60

interface UploadResponse {
  success: boolean
  mode: 'recreate' | 'fill' | 'analyze'
  formStructure?: any
  filledPDF?: string // Base64
  filledImage?: string // Base64
  error?: string
  provider?: string
}

// Detect file type from buffer
function detectFileType(buffer: Buffer): { type: string; mime: string } {
  // Check magic bytes
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { type: 'pdf', mime: 'application/pdf' }
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { type: 'png', mime: 'image/png' }
  }
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { type: 'jpg', mime: 'image/jpeg' }
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { type: 'gif', mime: 'image/gif' }
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return { type: 'webp', mime: 'image/webp' }
  }
  return { type: 'unknown', mime: 'application/octet-stream' }
}

// Analyze image with Vision AI
async function analyzeImageWithVision(imageBase64: string, mimeType: string): Promise<VisionAnalysisResult> {
  const providers = getVisionProviders()
  
  if (providers.length === 0) {
    return {
      success: false,
      confidence: 0,
      error: 'No vision AI providers configured. Add API keys for Z.ai, OpenRouter, or OpenAI.'
    }
  }

  for (const provider of providers) {
    try {
        
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      })

      const response = await client.chat.completions.create({
        model: provider.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_FORM_ANALYSIS_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Empty response')

      // Parse JSON from response
      let parsed
      try {
        let cleaned = content.trim()
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
        cleaned = cleaned.trim()
        parsed = JSON.parse(cleaned)
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse vision response as JSON')
        }
      }

        
      return {
        success: true,
        formStructure: parsed,
        confidence: 0.85,
      }
    } catch (error: any) {
          continue
    }
  }

  return {
    success: false,
    confidence: 0,
    error: 'All vision providers failed to analyze the image'
  }
}

// Convert extracted structure to RevoForms format
function convertToRevoFormStructure(visionResult: any, pdfStructure?: any): any {
  const fields = visionResult?.fields || pdfStructure?.fields || []
  
  return {
    name: visionResult?.title || pdfStructure?.title || 'Imported Form',
    description: visionResult?.description || '',
    fields: fields.map((field: any, index: number) => ({
      id: `imported_${index + 1}`,
      type: mapFieldType(field.type),
      label: field.label || field.name || `Field ${index + 1}`,
      placeholder: field.placeholder || '',
      required: field.required || false,
      options: field.options || undefined,
      position: field.position,
    })),
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!',
      collectEmails: true,
    },
    styling: {
      theme: 'modern-light',
      colors: visionResult?.styling || {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textMuted: '#64748b',
        border: '#e2e8f0',
        error: '#ef4444',
        success: '#22c55e',
        accent: '#06b6d4',
      },
    },
    sourceType: pdfStructure ? 'pdf' : 'image',
  }
}

function mapFieldType(type: string): string {
  const mapping: Record<string, string> = {
    'text': 'text',
    'email': 'email',
    'phone': 'phone',
    'tel': 'phone',
    'number': 'number',
    'date': 'date',
    'time': 'time',
    'textarea': 'textarea',
    'select': 'select',
    'dropdown': 'select',
    'radio': 'radio',
    'checkbox': 'checkbox',
    'signature': 'signature',
    'file': 'file',
    'address': 'address',
    'name': 'text',
    'unknown': 'text',
  }
  return mapping[type?.toLowerCase()] || 'text'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = (formData.get('mode') as string) || 'recreate' // recreate | fill | analyze
    const fillDataStr = formData.get('fillData') as string | null
    const fillData = fillDataStr ? JSON.parse(fillDataStr) : null

    // NanoBanana options for image filling
    const handwritingStyle = formData.get('handwritingStyle') as string || 'casual'
    const fontFamily = formData.get('fontFamily') as string || undefined
    const textColor = formData.get('textColor') as string || '#000000'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

  
    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileType = detectFileType(buffer)
    
  
    // ==================== PDF PROCESSING ====================
    if (fileType.type === 'pdf') {
      // Extract PDF structure
      const pdfStructure = await extractPDFStructure(buffer)
      
      if (mode === 'fill' && fillData && pdfStructure.hasAcroForm) {
        // Fill the PDF form
        const fillResult = await fillPDFForm({
          pdfBytes: buffer,
          fieldValues: fillData,
          flatten: false,
        })

        if (fillResult.success && fillResult.pdfBytes) {
          const base64PDF = Buffer.from(fillResult.pdfBytes).toString('base64')
          return NextResponse.json({
            success: true,
            mode: 'fill',
            filledPDF: base64PDF,
            formStructure: convertToRevoFormStructure(null, pdfStructure),
          })
        } else {
          return NextResponse.json({
            success: false,
            error: fillResult.error || 'Failed to fill PDF',
          })
        }
      }

      // If PDF has form fields, use them directly
      if (pdfStructure.hasAcroForm && pdfStructure.fields.length > 0) {
        return NextResponse.json({
          success: true,
          mode: 'recreate',
          formStructure: convertToRevoFormStructure(null, pdfStructure),
          provider: 'pdf-lib',
        })
      }

      // PDF without form fields - convert to image and analyze with vision
      // For now, return basic structure
      return NextResponse.json({
        success: true,
        mode: 'analyze',
        formStructure: {
          name: pdfStructure.title || 'Imported PDF',
          description: 'This PDF does not contain fillable form fields. Vision analysis may be needed.',
          fields: [],
          pageCount: pdfStructure.pageCount,
        },
        provider: 'pdf-lib',
      })
    }

    // ==================== IMAGE PROCESSING ====================
    if (['png', 'jpg', 'gif', 'webp'].includes(fileType.type)) {
      const imageBase64 = buffer.toString('base64')

      // Mode: Fill image form with NanoBanana
      if (mode === 'fill' && fillData) {
        const nanobanana = getNanoBananaClient()
        
        if (!nanobanana.isConfigured()) {
          // NanoBanana not configured - return info for manual setup
          return NextResponse.json({
            success: false,
            error: 'NanoBanana API not configured. Add NANOBANANA_API_KEY to environment to enable image form filling.',
            requiresConfig: 'nanobanana',
          })
        }

        // Build text fills from fillData
        const textFills: TextFill[] = Object.entries(fillData).map(([fieldId, value]) => {
          const position = fillData[`${fieldId}_position`] || { x: 100, y: 100 }
          return {
            text: String(value),
            position,
            style: {
              mode: fontFamily ? 'font' : 'handwriting',
              handwritingStyle: handwritingStyle as any,
              fontFamily,
              color: textColor,
              fontSize: 14,
            },
          }
        }).filter(fill => fill.text && fill.text.trim())

        const fillResult = await nanobanana.fillForm({
          image: imageBase64,
          textFills,
          outputFormat: 'png',
        })

        if (fillResult.success) {
          return NextResponse.json({
            success: true,
            mode: 'fill',
            filledImage: fillResult.image,
            provider: 'nanobanana',
          })
        } else {
          return NextResponse.json({
            success: false,
            error: fillResult.error || 'Failed to fill image form',
          })
        }
      }

      // Mode: Analyze/Recreate - use Vision AI to extract form structure
      const visionResult = await analyzeImageWithVision(imageBase64, fileType.mime)

      if (visionResult.success && visionResult.formStructure) {
        return NextResponse.json({
          success: true,
          mode: mode === 'analyze' ? 'analyze' : 'recreate',
          formStructure: convertToRevoFormStructure(visionResult.formStructure),
          confidence: visionResult.confidence,
          provider: 'vision-ai',
          // Include original image for reference/filling
          originalImage: imageBase64,
          detectedFields: visionResult.formStructure.fields,
        })
      } else {
        return NextResponse.json({
          success: false,
          error: visionResult.error || 'Failed to analyze image',
        })
      }
    }

    // Unsupported file type
    return NextResponse.json({
      success: false,
      error: `Unsupported file type: ${fileType.type}. Supported: PDF, PNG, JPG, GIF, WebP`,
    }, { status: 400 })

  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload processing failed',
    }, { status: 500 })
  }
}

// GET endpoint to check upload capabilities
export async function GET() {
  const visionProviders = getVisionProviders()
  const nanobanana = getNanoBananaClient()

  return NextResponse.json({
    capabilities: {
      pdf: {
        extract: true,
        fill: true,
        create: true,
      },
      image: {
        analyze: visionProviders.length > 0,
        fill: nanobanana.isConfigured(),
        visionProviders: visionProviders.map(p => p.name),
      },
      nanobanana: {
        configured: nanobanana.isConfigured(),
        features: ['handwriting', 'fonts', 'signatures', 'overlays'],
      },
    },
    supportedFormats: ['pdf', 'png', 'jpg', 'gif', 'webp'],
  })
}
