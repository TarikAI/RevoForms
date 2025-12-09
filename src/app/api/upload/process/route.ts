/**
 * Upload Processing API
 * Handles PDF, Image, and Document uploads for form processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { PDFService } from '@/services/pdfService'
import { visionService } from '@/services/visionService'
import { nanoBananaService } from '@/services/nanoBananaService'
import type { 
  UploadFileType, 
  ProcessingMode, 
  ProcessingResult,
  DetectedField
} from '@/types/upload'

function detectFileType(mimeType: string): UploadFileType {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType === 'text/html') return 'html'
  return 'unknown'
}

function mapFieldType(type: string): string {
  const typeMap: Record<string, string> = {
    'text': 'text', 'textfield': 'text', 'input': 'text',
    'email': 'email', 'mail': 'email',
    'phone': 'phone', 'telephone': 'phone', 'tel': 'phone',
    'number': 'number', 'numeric': 'number',
    'textarea': 'textarea', 'multiline': 'textarea',
    'select': 'select', 'dropdown': 'select', 'combo': 'select',
    'radio': 'radio', 'radiobutton': 'radio',
    'checkbox': 'checkbox', 'check': 'checkbox',
    'date': 'date', 'calendar': 'date',
    'signature': 'signature', 'sign': 'signature',
    'file': 'file', 'upload': 'file', 'attachment': 'file'
  }
  return typeMap[type.toLowerCase()] || 'text'
}

function visionFieldsToFormFields(visionFields: any[]): DetectedField[] {
  return visionFields.map((field, index) => ({
    id: `field_${index + 1}`,
    label: field.label || `Field ${index + 1}`,
    type: mapFieldType(field.type),
    required: field.required || false,
    options: field.options,
    bounds: field.bounds
  }))
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = (formData.get('mode') as ProcessingMode) || 'recreate'
    const fieldValuesStr = formData.get('fieldValues') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const mimeType = file.type
    const fileType = detectFileType(mimeType)
    const arrayBuffer = await file.arrayBuffer()
    
    
    let result: ProcessingResult

    switch (fileType) {
      case 'pdf':
        result = await processPDF(arrayBuffer, mode, fieldValuesStr)
        break
      case 'image':
        result = await processImage(arrayBuffer, mimeType, mode, fieldValuesStr)
        break
      default:
        result = { success: false, mode, error: `Unsupported file type: ${fileType}` }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Upload] Processing error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}

async function processPDF(
  data: ArrayBuffer, 
  mode: ProcessingMode,
  fieldValuesStr: string | null
): Promise<ProcessingResult> {
  try {
    // Analyze the PDF
    const analysis = await PDFService.analyze(data)
    const textContent = await PDFService.extractText(data)
    
    
    if (mode === 'fill' && fieldValuesStr) {
      // Fill the PDF with provided values
      const fieldValues = JSON.parse(fieldValuesStr)
      const fillResult = await PDFService.fill({
        pdfData: data,
        fieldValues,
        flattenAfterFill: false
      })

      if (fillResult.success && fillResult.filledPdf) {
        return {
          success: true,
          mode,
          filledPdf: fillResult.filledPdf,
          analysis: {
            title: analysis.metadata?.title,
            fields: analysis.fields.map(f => ({
              id: f.name,
              label: f.name,
              type: f.type,
              value: fieldValues[f.name],
              options: f.options
            })),
            pageCount: analysis.pageCount,
            confidence: 1.0,
            rawText: textContent
          }
        }
      }
      return { success: false, mode, error: fillResult.error }
    }

    // Recreate mode - convert PDF to editable form
    const fields: DetectedField[] = analysis.fields.map(f => ({
      id: f.name,
      label: f.name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      type: f.type,
      value: f.value,
      options: f.options,
      bounds: f.bounds
    }))

    // If no form fields, try to extract from text using AI
    if (fields.length === 0 && textContent) {
            // Could use AI to analyze text and detect implied fields
    }

    return {
      success: true,
      mode,
      analysis: {
        title: analysis.metadata?.title || 'Imported PDF Form',
        fields,
        pageCount: analysis.pageCount,
        confidence: analysis.hasFormFields ? 0.95 : 0.6,
        rawText: textContent
      },
      generatedForm: {
        name: analysis.metadata?.title || 'Imported Form',
        description: analysis.metadata?.subject || 'Imported from PDF',
        fields: fields.map(f => ({
          id: f.id,
          type: f.type,
          label: f.label,
          required: f.required || false,
          options: f.options,
          placeholder: ''
        })),
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Form submitted successfully!'
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      mode,
      error: `PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}


async function processImage(
  data: ArrayBuffer,
  mimeType: string,
  mode: ProcessingMode,
  fieldValuesStr: string | null
): Promise<ProcessingResult> {
  try {
    // Convert to base64 for API calls
    const base64 = PDFService.arrayBufferToBase64(data)
    const imageDataUrl = `data:${mimeType};base64,${base64}`

    
    // Use AI vision to analyze the form image
    const visionResult = await visionService.analyzeForm(base64)

    if (!visionResult.success) {
      return {
        success: false,
        mode,
        error: visionResult.error || 'Failed to analyze image'
      }
    }

    
    const fields = visionFieldsToFormFields(visionResult.fields || [])

    if (mode === 'edit-image' && fieldValuesStr) {
      // Use NanoBanana to edit the image with provided values
      const fieldValues = JSON.parse(fieldValuesStr) as Array<{
        text: string
        position: { x: number; y: number }
        style?: any
      }>

      const editResult = await nanoBananaService.fillFormImage(base64, fieldValues)

      if (editResult.success && editResult.editedImage) {
        return {
          success: true,
          mode,
          editedImage: PDFService.base64ToArrayBuffer(editResult.editedImage),
          analysis: {
            title: visionResult.title,
            fields,
            confidence: 0.85,
            layout: visionResult.layout as any
          }
        }
      }

      return { success: false, mode, error: editResult.error }
    }

    // Recreate mode - convert image form to editable form
    return {
      success: true,
      mode,
      analysis: {
        title: visionResult.title || 'Imported Form',
        fields,
        confidence: 0.8,
        layout: visionResult.layout as any
      },
      generatedForm: {
        name: visionResult.title || 'Imported Form',
        description: 'Imported from image',
        fields: fields.map(f => ({
          id: f.id,
          type: f.type,
          label: f.label,
          required: f.required || false,
          options: f.options,
          placeholder: ''
        })),
        settings: {
          submitButtonText: 'Submit',
          successMessage: 'Form submitted successfully!'
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      mode,
      error: `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// GET endpoint to check available providers
export async function GET() {
  return NextResponse.json({
    visionProviders: visionService.getAvailableProviders(),
    nanoBananaAvailable: nanoBananaService.isAvailable(),
    supportedTypes: ['pdf', 'image/png', 'image/jpeg', 'image/webp'],
    modes: ['recreate', 'fill', 'edit-image', 'convert']
  })
}
