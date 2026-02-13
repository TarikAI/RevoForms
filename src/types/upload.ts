// Upload and Processing Types

export type UploadFileType = 'pdf' | 'image' | 'document' | 'html' | 'unknown'

export type ProcessingMode = 
  | 'recreate'      // Create editable RevoForm from upload
  | 'fill'          // Fill existing form fields
  | 'edit-image'    // Edit image with NanoBanana
  | 'convert'       // Convert between formats

export interface UploadedFile {
  id: string
  name: string
  type: UploadFileType
  mimeType: string
  size: number
  data: ArrayBuffer | string  // ArrayBuffer for binary, base64 string for API
  preview?: string            // Base64 preview image
}

export interface DetectedField {
  id: string
  label: string
  type: string
  bounds?: {
    x: number
    y: number
    width: number
    height: number
    page?: number
  }
  value?: string
  required?: boolean
  options?: string[]
}

export interface FormAnalysisResult {
  title?: string
  description?: string
  fields: DetectedField[]
  pageCount?: number
  confidence: number
  rawText?: string
  layout?: 'single-column' | 'two-column' | 'grid' | 'mixed'
}

export interface ProcessingResult {
  success: boolean
  mode: ProcessingMode
  analysis?: FormAnalysisResult
  generatedForm?: any  // CanvasForm data
  filledPdf?: ArrayBuffer
  editedImage?: ArrayBuffer
  error?: string
}

// Vision Provider Types
export interface VisionProvider {
  name: string
  analyze: (imageData: string, prompt: string) => Promise<string>
  isAvailable: () => boolean
}

export interface VisionAnalysisRequest {
  image: string  // Base64 encoded
  prompt: string
  provider?: string
}

export interface VisionAnalysisResponse {
  success: boolean
  result?: string
  provider: string
  error?: string
}

// NanoBanana Types
export interface NanoBananaConfig {
  apiKey: string
  baseUrl?: string
}

export interface NanoBananaEditRequest {
  image: string  // Base64 encoded original image
  edits: NanoBananaEdit[]
}

export interface NanoBananaEdit {
  type: 'text' | 'signature' | 'image' | 'stamp' | 'typed' | 'handwriting'
  position: { x: number; y: number }
  content?: string  // Text content or base64 image
  style?: {
    font?: string
    fontFamily?: string
    fontSize?: number
    color?: string
    handwriting?: boolean
    handwritingStyle?: 'casual' | 'formal' | 'cursive' | 'print' | 'signature'
    rotation?: number
    opacity?: number
    textShadow?: {
      color?: string
      blur?: number
      x?: number
      y?: number
    }
  }
  bounds?: { width: number; height: number }
}

export interface NanoBananaResponse {
  success: boolean
  editedImage?: string  // Base64 encoded result
  error?: string
}

// PDF Processing Types
export interface PDFField {
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date'
  value?: string
  options?: string[]
  required?: boolean
  bounds?: { x: number; y: number; width: number; height: number; page: number }
}

export interface PDFAnalysis {
  pageCount: number
  hasFormFields: boolean
  fields: PDFField[]
  text: string
  metadata?: {
    title?: string
    author?: string
    subject?: string
  }
}

export interface PDFFillRequest {
  pdfData: ArrayBuffer
  fieldValues: Record<string, string | boolean>
  flattenAfterFill?: boolean
}

export interface PDFFillResponse {
  success: boolean
  filledPdf?: ArrayBuffer
  error?: string
}
