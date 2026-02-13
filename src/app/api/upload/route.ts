import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractPDFStructure, fillPDFForm } from '@/lib/pdf-utils'
import { getVisionProviders, VISION_FORM_ANALYSIS_PROMPT, type VisionAnalysisResult } from '@/lib/vision-providers'
import { getNanoBananaClient, type FillImageRequest, type TextFill } from '@/lib/nanobanana-client'

export const runtime = 'nodejs'
export const maxDuration = 60

interface UploadResponse {
  success: boolean
  mode: 'create' | 'fill' | 'analyze' | 'batch'
  formStructure?: any
  filledPDF?: string // Base64
  filledImage?: string // Base64
  error?: string
  provider?: string
  batchResults?: BatchFileResult[]
  summary?: {
    total: number
    success: number
    failed: number
  }
}

interface BatchFileResult {
  filename: string
  success: boolean
  formStructure?: any
  error?: string
  provider?: string
}

// Process a single file
async function processSingleFile(
  file: File,
  mode: string,
  fillData: any,
  handwritingStyle: string,
  fontFamily: string,
  textColor: string
): Promise<BatchFileResult> {
  const filename = file.name
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const fileType = detectFileType(buffer)

  try {
    // ==================== PDF PROCESSING ====================
    if (fileType.type === 'pdf') {
      const pdfStructure = await extractPDFStructure(buffer)

      if (mode === 'fill' && fillData && pdfStructure.hasAcroForm) {
        const fillResult = await fillPDFForm({
          pdfBytes: buffer,
          fieldValues: fillData,
          flatten: false,
        })

        if (fillResult.success && fillResult.pdfBytes) {
          const base64PDF = Buffer.from(fillResult.pdfBytes).toString('base64')
          return {
            filename,
            success: true,
            formStructure: {
              ...convertToRevoFormStructure(null, pdfStructure),
              filledPDF: base64PDF,
            },
            provider: 'pdf-lib',
          }
        } else {
          return {
            filename,
            success: false,
            error: fillResult.error || 'Failed to fill PDF',
          }
        }
      }

      if (pdfStructure.hasAcroForm && pdfStructure.fields.length > 0) {
        return {
          filename,
          success: true,
          formStructure: convertToRevoFormStructure(null, pdfStructure),
          provider: 'pdf-lib',
        }
      }

      return {
        filename,
        success: true,
        formStructure: {
          name: pdfStructure.title || 'Imported PDF',
          description: 'This PDF does not contain fillable form fields. Vision analysis may be needed.',
          fields: [],
          pageCount: pdfStructure.pageCount,
        },
        provider: 'pdf-lib',
      }
    }

    // ==================== IMAGE PROCESSING ====================
    if (['png', 'jpg', 'gif', 'webp'].includes(fileType.type)) {
      const imageBase64 = buffer.toString('base64')

      // Mode: Fill image form with NanoBanana
      if (mode === 'fill' && fillData) {
        const nanobanana = getNanoBananaClient()

        if (!nanobanana.isConfigured()) {
          return {
            filename,
            success: false,
            error: 'NanoBanana API not configured. Add NANOBANANA_API_KEY to environment to enable image form filling.',
          }
        }

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
          return {
            filename,
            success: true,
            formStructure: {
              filledImage: fillResult.image,
            },
            provider: 'nanobanana',
          }
        } else {
          return {
            filename,
            success: false,
            error: fillResult.error || 'Failed to fill image form',
          }
        }
      }

      // Mode: Analyze/Create - use Vision AI to extract form structure
      const visionResult = await analyzeImageWithVision(imageBase64, fileType.mime)

      if (visionResult.success && visionResult.formStructure) {
        return {
          filename,
          success: true,
          formStructure: convertToRevoFormStructure(visionResult.formStructure),
          provider: 'vision-ai',
          originalImage: imageBase64,
          detectedFields: visionResult.formStructure.fields,
        }
      } else {
        return {
          filename,
          success: false,
          error: visionResult.error || 'Failed to analyze image',
        }
      }
    }

    // Unsupported file type
    return {
      filename,
      success: false,
      error: `Unsupported file type: ${fileType.type}. Supported: PDF, PNG, JPG, GIF, WebP`,
    }
  } catch (error: any) {
    return {
      filename,
      success: false,
      error: error.message || 'Failed to process file',
    }
  }
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
      error: 'No vision AI providers configured. Add API keys for Z.ai, OpenRouter, or OpenAI.',
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
    error: 'All vision providers failed to analyze image',
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

    // Check if this is a batch upload or single upload
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null

    const mode = (formData.get('mode') as string) || 'create' // create | fill | analyze
    const fillDataStr = formData.get('fillData') as string | null
    const fillData = fillDataStr ? JSON.parse(fillDataStr) : null
    const batchMode = formData.get('batchMode') as string || 'separate' // separate | combined

    // NanoBanana options for image filling
    const handwritingStyle = formData.get('writingStyle') as string || 'casual'
    const fontFamily = formData.get('fontFamily') as string || undefined
    const textColor = formData.get('textColor') as string || '#000000'

    // Handle multiple files upload
    if (files.length > 0) {
      const results = await Promise.allSettled(
        files.map(file =>
          processSingleFile(file, mode, fillData, handwritingStyle, fontFamily, textColor)
        )
      )

      const batchResults: BatchFileResult[] = results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            filename: 'unknown',
            success: false,
            error: 'Processing failed',
          }
        }
      })

      const success = batchResults.filter(r => r.success)
      const failed = batchResults.filter(r => !r.success)

      // If batch mode is 'combined', try to merge all forms into one
      if (batchMode === 'combined' && success.length > 1) {
        const combinedForm = combineForms(batchResults.filter(r => r.success && r.formStructure))
        return NextResponse.json({
          success: true,
          mode: 'batch',
          formStructure: combinedForm,
          batchResults,
          summary: {
            total: files.length,
            success: success.length,
            failed: failed.length,
          },
        })
      }

      return NextResponse.json({
        success: true,
        mode: 'batch',
        batchResults,
        summary: {
          total: files.length,
          success: success.length,
          failed: failed.length,
        },
      })
    }

    // Handle single file upload (backward compatibility)
    const file = singleFile
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const result = await processSingleFile(file, mode, fillData, handwritingStyle, fontFamily, textColor)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mode: mode === 'analyze' ? 'analyze' : 'create',
      formStructure: result.formStructure,
      filledPDF: result.formStructure?.filledPDF,
      filledImage: result.formStructure?.filledImage,
      provider: result.provider,
      originalImage: result.originalImage,
      detectedFields: result.detectedFields,
    })

  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload processing failed',
    }, { status: 500 })
  }
}

// Combine multiple forms into a single combined form
function combineForms(results: BatchFileResult[]): any {
  const allFields: any[] = []
  const sources: string[] = []

  results.forEach((result, index) => {
    if (result.formStructure && result.formStructure.fields) {
      const formFields = result.formStructure.fields.map((field: any) => ({
        ...field,
        id: `${result.filename.replace(/[^a-zA-Z0-9]/g, '_')}_${field.id}`,
        sourceForm: result.filename,
      }))

      allFields.push(...formFields)
      sources.push(result.filename)
    }
  })

  return {
    name: 'Combined Form',
    description: `Combined form from ${sources.length} documents`,
    fields: allFields,
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!',
      collectEmails: true,
    },
    styling: {
      theme: 'modern-light',
    },
    sourceType: 'combined',
    sources,
  }
}

// GET endpoint to check upload capabilities
export async function GET() {
  const visionProviders = getVisionProviders()
  const nanobanana = getNanoBananaClient()

  return NextResponse.json({
    capabilities: {
      multipleFiles: true,
      batchModes: ['separate', 'combined'],
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
